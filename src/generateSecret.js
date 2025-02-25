import crypto from 'crypto';
const SECRET_KEY = crypto.randomBytes(64).toString('hex');

console.log(SECRET_KEY);
