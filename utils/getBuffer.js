import axios from 'axios';

export async function getBuffer(url) {
  const res = await axios.get(url, { responseType: 'arraybuffer' });
  return Buffer.from(res.data);
}