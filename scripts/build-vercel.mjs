import {mkdir,writeFile} from 'node:fs/promises';
await import('../api/index.js');await mkdir('public',{recursive:true});await writeFile('public/.keep','');console.log('Vercel server validated.');
