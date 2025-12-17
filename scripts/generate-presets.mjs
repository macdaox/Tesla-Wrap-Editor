import fs from 'fs';
import path from 'path';

const publicDir = path.join(process.cwd(), 'public');
const assetsDir = path.join(publicDir, 'assets');
const outputFile = path.join(publicDir, 'presets.json');

// Get all model directories
const models = fs.readdirSync(assetsDir).filter(file => {
    return fs.statSync(path.join(assetsDir, file)).isDirectory();
});

const presets = {};

models.forEach(model => {
    const exampleDir = path.join(assetsDir, model, 'example');
    if (fs.existsSync(exampleDir)) {
        const files = fs.readdirSync(exampleDir);
        const images = files.filter(file => file.endsWith('.png') || file.endsWith('.jpg'));
        if (images.length > 0) {
            presets[model] = images;
        }
    }
});

fs.writeFileSync(outputFile, JSON.stringify(presets, null, 2));
console.log(`Generated presets.json with ${Object.keys(presets).length} models.`);