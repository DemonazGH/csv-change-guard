'use strict';
// Builds one file that can be opened directly in a browser. No install/build dependencies.
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, 'src', file), 'utf8');
let html = read('index.html').replace('<link rel="stylesheet" href="styles.css">', '<style>\n' + read('styles.css') + '\n</style>');
for (const file of ['engine.js', 'demo.js', 'app.js']) html = html.replace('<script src="' + file + '"></script>', '<script>\n' + read(file).replace(/<\/script/gi, '<\\/script') + '\n</script>');
fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'dist', 'index.html'), html);
console.log('Built dist/index.html (' + Buffer.byteLength(html).toLocaleString() + ' bytes).');
