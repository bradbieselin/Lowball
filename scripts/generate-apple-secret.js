// Generate an Apple Sign-In client secret JWT for Supabase
//
// Usage:
//   node scripts/generate-apple-secret.js <path-to-.p8-file> <key-id> <team-id>
//
// Example:
//   node scripts/generate-apple-secret.js ~/Downloads/AuthKey_8N5U32UK74.p8 8N5U32UK74 FY5N2W429Y

const fs = require('fs');
const jwt = require('jsonwebtoken');

const [p8Path, keyId, teamId] = process.argv.slice(2);

if (!p8Path || !keyId || !teamId) {
  console.error('Usage: node generate-apple-secret.js <p8-path> <key-id> <team-id>');
  process.exit(1);
}

const privateKey = fs.readFileSync(p8Path, 'utf8');
const now = Math.floor(Date.now() / 1000);

const token = jwt.sign(
  {
    iss: teamId,
    iat: now,
    exp: now + 15777000,
    aud: 'https://appleid.apple.com',
    sub: 'com.bradbieselin.lowball',
  },
  privateKey,
  {
    algorithm: 'ES256',
    header: { kid: keyId },
  }
);

console.log(token);
