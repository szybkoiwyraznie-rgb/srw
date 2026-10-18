#!/usr/bin/env node
/** Read-only inventory via the AWS CLI; no SDK or runtime dependencies. */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const execute = promisify(execFile);
const endpointHost = /^[a-f0-9]{32}(?:\.(?:eu|fedramp))?\.r2\.cloudflarestorage\.com$/;

export function validateConfig(env) {
  for (const key of ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'R2_ENDPOINT', 'R2_BUCKET', 'R2_PUBLIC_BASE_URL']) {
    if (!env[key]?.trim()) throw new Error(`Brak konfiguracji: ${key}.`);
  }
  let endpoint, publicBase;
  try {
    endpoint = new URL(env.R2_ENDPOINT);
    publicBase = new URL(env.R2_PUBLIC_BASE_URL);
  } catch {
    throw new Error('Niepoprawny adres endpointu lub publicznego URL.');
  }
  if (endpoint.protocol !== 'https:' || !endpointHost.test(endpoint.hostname)
      || endpoint.username || endpoint.password || endpoint.port || endpoint.search || endpoint.hash
      || endpoint.pathname !== '/') {
    throw new Error('R2_ENDPOINT musi być adresem HTTPS endpointu S3 Cloudflare R2, bez ścieżki.');
  }
  if (publicBase.protocol !== 'https:' || publicBase.username || publicBase.password
      || publicBase.search || publicBase.hash) {
    throw new Error('Publiczny adres musi być adresem HTTPS bez danych logowania, zapytania i fragmentu.');
  }
  if (!/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(env.R2_BUCKET)) {
    throw new Error('Niepoprawna nazwa bucketa.');
  }
  return {
    endpoint: endpoint.origin,
    bucket: env.R2_BUCKET,
    publicBase: publicBase.href.replace(/\/$/, ''),
  };
}

export async function inventory(config, run = execute, now = () => new Date()) {
  const objects = [];
  const seen = new Set();
  let token;
  do {
    const args = [
      's3api', 'list-objects-v2', '--bucket', config.bucket,
      '--endpoint-url', config.endpoint, '--region', 'auto',
      '--output', 'json', '--no-cli-pager', '--no-paginate',
      '--max-keys', '1000', '--encoding-type', 'url',
    ];
    if (token) args.push('--continuation-token', token);
    let page;
    try {
      const result = await run('aws', args, { timeout: 60_000, maxBuffer: 16 * 1024 * 1024 });
      page = JSON.parse(result.stdout);
    } catch {
      // Do not print AWS stderr, environment, credentials, or signed requests.
      throw new Error('Nie udało się odczytać R2. Sprawdź AWS CLI, konfigurację i uprawnienia Object Read only.');
    }
    if (!page || typeof page !== 'object' || Array.isArray(page)
        || (page.Contents !== undefined && !Array.isArray(page.Contents))
        || (page.IsTruncated !== undefined && typeof page.IsTruncated !== 'boolean')) {
      throw new Error('Niepoprawna odpowiedź listy R2.');
    }
    for (const object of page.Contents ?? []) {
      if (!object || typeof object.Key !== 'string' || !Number.isSafeInteger(object.Size) || object.Size < 0
          || typeof object.LastModified !== 'string' || !Number.isFinite(Date.parse(object.LastModified))
          || (object.ETag !== undefined && typeof object.ETag !== 'string')) {
        throw new Error('Niepoprawne metadane obiektu R2.');
      }
      let key;
      try {
        key = page.EncodingType === 'url' ? decodeURIComponent(object.Key) : object.Key;
      } catch {
        throw new Error('Niepoprawne kodowanie nazwy obiektu R2.');
      }
      // Folder placeholders do not represent media files.
      if (key.endsWith('/')) continue;
      if (!key || key.split('/').some(part => part === '.' || part === '..')) {
        throw new Error('Nazwa obiektu zawiera segment niedopuszczalny w publicznym URL.');
      }
      const encoded = key.split('/').map(part => encodeURIComponent(part).replace(/[!'()*]/g,
        char => `%${char.charCodeAt(0).toString(16).toUpperCase()}`)).join('/');
      objects.push({
        key,
        size: object.Size,
        lastModified: object.LastModified,
        etag: object.ETag ?? null,
        url: `${config.publicBase}/${encoded}`,
      });
    }
    if (!page.IsTruncated) break;
    token = page.NextContinuationToken;
    if (typeof token !== 'string' || !token || seen.has(token)) {
      throw new Error('Niepoprawna paginacja R2 — lista nie została ukończona.');
    }
    seen.add(token);
  } while (true);
  objects.sort((a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0);
  return {
    schemaVersion: 1,
    generatedAt: now().toISOString(),
    bucket: config.bucket,
    publicBaseUrl: config.publicBase,
    objectCount: objects.length,
    totalBytes: objects.reduce((sum, object) => sum + object.size, 0),
    objects,
  };
}

async function main() {
  const config = validateConfig(process.env);
  const output = process.argv[2];
  if (!output) throw new Error('Podaj ścieżkę pliku wynikowego JSON.');
  const result = await inventory(config);
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(result, null, 2)}\n`, { mode: 0o600 });
  console.log(`Gotowa lista R2: ${result.objectCount} plików, ${result.totalBytes} bajtów.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
