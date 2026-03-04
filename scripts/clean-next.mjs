import { rm } from 'fs/promises';

try {
  await rm('.next', { recursive: true, force: true });
  console.log('Cleaned .next cache');
} catch {
  // directory may not exist — no-op
}
