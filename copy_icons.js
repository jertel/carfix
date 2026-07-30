const fs = require('fs');
const path = require('path');

const src = '/home/jertel/.gemini/antigravity-ide/brain/bf0197f8-8eb4-4fe7-ba5e-193a2516f837/carfix_app_icon_1785202033519.png';
const base = '/home/jertel/projects/carcommander/android/app/src/main/res';
const folders = ['mipmap-mdpi', 'mipmap-hdpi', 'mipmap-xhdpi', 'mipmap-xxhdpi', 'mipmap-xxxhdpi'];

folders.forEach(f => {
  const dir = path.join(base, f);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(src, path.join(dir, 'ic_launcher.png'));
  fs.copyFileSync(src, path.join(dir, 'ic_launcher_round.png'));
  fs.copyFileSync(src, path.join(dir, 'ic_launcher_foreground.png'));
});
console.log('Icon files successfully copied to Android res mipmap directories.');
