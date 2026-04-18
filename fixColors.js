const fs = require('fs');
const path = require('path');

const dirs = [
    path.join(__dirname, 'client/src/pages'),
    path.join(__dirname, 'client/src/components')
];

function hexToLuma(code) {
    let c = code.replace('#', '');
    if (c.length === 3) {
        c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    }
    const r = parseInt(c.substr(0, 2), 16);
    const g = parseInt(c.substr(2, 2), 16);
    const b = parseInt(c.substr(4, 2), 16);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
        const full = path.join(dir, f);
        if (fs.statSync(full).isDirectory()) {
            processDirectory(full);
        } else if (full.endsWith('.jsx')) {
            let content = fs.readFileSync(full, 'utf8');

            // 1. Replace tailwind generic colors (e.g. bg-blue-500 -> bg-[#F4991A])
            content = content.replace(/\b(bg|text|border|ring|from|to|fill|stroke|shadow)-([a-z]+)-(\d+)\b/g, (match, prefix, colorName, weightStr) => {
                const weight = parseInt(weightStr);
                let hex = '';
                if (weight <= 100) hex = '#F9F5F0';
                else if (weight <= 300) hex = '#F2EAD3';
                else if (weight <= 500) hex = '#F4991A';
                else hex = '#344F1F';
                return `${prefix}-[${hex}]`;
            });

            // 2. Replace raw hex codes based on luma map
            content = content.replace(/#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})\b/g, (match) => {
                const up = match.toUpperCase();
                if (['#F9F5F0', '#F2EAD3', '#F4991A', '#344F1F'].includes(up)) return match; // Keep target colors
                if (['#FFFFFF', '#FFF'].includes(up)) return '#F9F5F0';
                if (['#000000', '#000'].includes(up)) return '#344F1F';
                const luma = hexToLuma(up);
                if (luma > 230) return '#F9F5F0';
                else if (luma > 180) return '#F2EAD3';
                else if (luma > 100) return '#F4991A';
                else return '#344F1F';
            });

            // 3. Optional: replace base text-white and bg-white
            content = content.replace(/\b(text|bg|fill)-white\b/g, '$1-[#F9F5F0]');
            content = content.replace(/\b(text|bg|fill)-black\b/g, '$1-[#344F1F]');

            fs.writeFileSync(full, content, 'utf8');
        }
    }
}

dirs.forEach(processDirectory);
console.log('Successfully enforced Strict Hex colors across all pages and components!');
