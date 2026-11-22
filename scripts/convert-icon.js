const fs = require('fs');
const path = require('path');

const pngPath = path.join(__dirname, '../resources/icon.png');
const icoPath = path.join(__dirname, '../resources/icon.ico');

if (!fs.existsSync(pngPath)) {
  console.error('icon.png not found at', pngPath);
  process.exit(1);
}

const pngBuffer = fs.readFileSync(pngPath);

// ICO Header: 6 bytes
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // Reserved
header.writeUInt16LE(1, 2); // ICO format
header.writeUInt16LE(1, 4); // 1 image

// Directory Entry: 16 bytes
const entry = Buffer.alloc(16);
entry.writeUInt8(0, 0);     // Width (0 = 256px+)
entry.writeUInt8(0, 1);     // Height (0 = 256px+)
entry.writeUInt8(0, 2);     // Color count (0 = no palette)
entry.writeUInt8(0, 3);     // Reserved
entry.writeUInt16LE(1, 4);  // Color planes
entry.writeUInt16LE(32, 6); // Bits per pixel (32bpp RGBA)
entry.writeUInt32LE(pngBuffer.length, 8); // Size of PNG data
entry.writeUInt32LE(22, 12);              // Offset (6 + 16 = 22)

const icoBuffer = Buffer.concat([header, entry, pngBuffer]);
fs.writeFileSync(icoPath, icoBuffer);
console.log('Successfully generated icon.ico (size:', icoBuffer.length, 'bytes)');
