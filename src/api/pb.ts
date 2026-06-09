import PocketBase from 'pocketbase';
import { POCKETBASE_URL } from '@/constants/config';

// Empty string = same origin (nginx proxies /api/ to pocketbase in Docker)
// On web use window.location.origin, on native fall back to localhost
const baseUrl = POCKETBASE_URL ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1:8092');

const pb = new PocketBase(baseUrl);

export default pb;
