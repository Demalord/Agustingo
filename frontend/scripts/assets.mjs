// Genera assets/icon.png (1024), assets/splash.png (2732) y public/favicon.png desde SVG.
// Uso: node scripts/assets.mjs && npx capacitor-assets generate --android
import sharp from 'sharp';
import { mkdirSync } from 'fs';

const VERDE = '#7ac70c', VERDE_OSC = '#5a9a06';

// burbuja de diálogo blanca con "Ag", centrada en (0,0), ~520px de ancho
const burbuja = `
  <rect x="-260" y="-200" width="520" height="380" rx="110" fill="#fff"/>
  <path d="M -130 160 L -170 290 L 20 160 Z" fill="#fff"/>
  <text x="0" y="78" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
        font-weight="900" font-size="250" fill="${VERDE_OSC}">Ag</text>`;

const icono = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">
  <rect width="1024" height="1024" fill="${VERDE}"/>
  <g transform="translate(512 490)">${burbuja}</g>
</svg>`;

const splash = `<svg xmlns="http://www.w3.org/2000/svg" width="2732" height="2732">
  <rect width="2732" height="2732" fill="${VERDE}"/>
  <g transform="translate(1366 1240) scale(1.1)">${burbuja}</g>
  <text x="1366" y="1720" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
        font-weight="900" font-size="170" fill="#fff">agustingo</text>
</svg>`;

mkdirSync('assets', { recursive: true });
mkdirSync('public', { recursive: true });
await sharp(Buffer.from(icono)).png().toFile('assets/icon.png');
await sharp(Buffer.from(icono)).png().toFile('assets/icon-only.png'); // nombre que lee @capacitor/assets
await sharp(Buffer.from(splash)).png().toFile('assets/splash.png');
await sharp(Buffer.from(icono)).resize(192).png().toFile('public/favicon.png');
console.log('assets generados');
