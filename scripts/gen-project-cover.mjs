import sharp from 'sharp';

const width = 1280, height = 720;

function rand(min, max) { return min + Math.random() * (max - min); }

const nodes = Array.from({length: 20}, () => ({
  x: rand(100, 1180), y: rand(80, 640), r: rand(3, 8), o: rand(0.3, 0.8)
}));

const lines = Array.from({length: 15}, () => ({
  x1: rand(100, 1180), y1: rand(80, 640),
  x2: rand(100, 1180), y2: rand(80, 640)
}));

const papers = [{x:320,y:200},{x:640,y:350},{x:960,y:250},{x:480,y:450},{x:800,y:500}];

const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a2e"/>
      <stop offset="50%" style="stop-color:#16213e"/>
      <stop offset="100%" style="stop-color:#0f3460"/>
    </linearGradient>
    <radialGradient id="glow1" cx="30%" cy="40%" r="30%">
      <stop offset="0%" style="stop-color:#e94560;stop-opacity:0.3"/>
      <stop offset="100%" style="stop-color:#e94560;stop-opacity:0"/>
    </radialGradient>
    <radialGradient id="glow2" cx="70%" cy="60%" r="25%">
      <stop offset="0%" style="stop-color:#533483;stop-opacity:0.4"/>
      <stop offset="100%" style="stop-color:#533483;stop-opacity:0"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <rect width="100%" height="100%" fill="url(#glow1)"/>
  <rect width="100%" height="100%" fill="url(#glow2)"/>
  ${lines.map(l => `<line x1="${l.x1}" y1="${l.y1}" x2="${l.x2}" y2="${l.y2}" stroke="white" stroke-width="0.5" opacity="0.15"/>`).join('\n  ')}
  ${nodes.map(n => `<circle cx="${n.x}" cy="${n.y}" r="${n.r}" fill="white" opacity="${n.o}"/>`).join('\n  ')}
  ${papers.map(p => `<g transform="translate(${p.x},${p.y}) rotate(${rand(-10, 10).toFixed(1)})" opacity="0.6">
    <rect x="-20" y="-25" width="40" height="50" rx="3" fill="none" stroke="white" stroke-width="1.2" opacity="0.4"/>
    <line x1="-12" y1="-15" x2="12" y2="-15" stroke="white" stroke-width="1" opacity="0.3"/>
    <line x1="-12" y1="-8" x2="12" y2="-8" stroke="white" stroke-width="1" opacity="0.3"/>
    <line x1="-12" y1="-1" x2="8" y2="-1" stroke="white" stroke-width="1" opacity="0.3"/>
  </g>`).join('\n  ')}
</svg>`;

await sharp(Buffer.from(svg))
  .webp({ quality: 85 })
  .toFile('public/images/projects/awesome-deep-learning-papers-cover.webp');

console.log('Cover image created: public/images/projects/awesome-deep-learning-papers-cover.webp');
