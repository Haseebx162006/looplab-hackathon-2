import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse') as (buffer: Buffer) => Promise<{ text?: string }>;

function bufferFromUploadPayload(file: string): Buffer {
  const match = file.match(/^data:.*?;base64,(.+)$/s);
  const b64 = match ? match[1] : file;
  const restoredB64 = b64.replace(/ /g, '+').replace(/\s/g, '');
  return Buffer.from(restoredB64, 'base64');
}

export async function extractCvText(file: string): Promise<string> {
  const buffer = bufferFromUploadPayload(file);
  if (buffer.length < 100) {
    return '';
  }

  const parsed = await pdfParse(buffer);
  return (parsed.text || '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
