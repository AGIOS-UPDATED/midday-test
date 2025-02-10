const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Paths
const ROOT_DIR = path.resolve(__dirname, '..');
const DASHBOARD_DIR = path.join(ROOT_DIR, 'apps/dashboard');
const DEPLOY_DIR = path.join(ROOT_DIR, 'deploy');
const PACKAGES_DIR = path.join(ROOT_DIR, 'packages');

// Clean and create deploy directory
if (fs.existsSync(DEPLOY_DIR)) {
  fs.rmSync(DEPLOY_DIR, { recursive: true });
}
fs.mkdirSync(DEPLOY_DIR);

// Function to resolve workspace dependencies in package.json
function resolveWorkspaceDeps(pkgPath) {
  if (!fs.existsSync(pkgPath)) return;
  
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  if (!pkg.dependencies) return;

  Object.entries(pkg.dependencies).forEach(([name, version]) => {
    if (version === 'workspace:*') {
      pkg.dependencies[name] = '*';
    }
  });

  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
}

// Function to process all package.json files in a directory
function processPackageJsonFiles(dir) {
  const items = fs.readdirSync(dir);
  
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processPackageJsonFiles(fullPath);
    } else if (item === 'package.json') {
      resolveWorkspaceDeps(fullPath);
    }
  });
}

// Copy root package.json and other necessary files
execSync(`cp ${ROOT_DIR}/package.json ${DEPLOY_DIR}/`);
execSync(`cp ${ROOT_DIR}/bun.lockb ${DEPLOY_DIR}/`);
execSync(`cp ${ROOT_DIR}/turbo.json ${DEPLOY_DIR}/`);

// Create packages directory in deploy
fs.mkdirSync(path.join(DEPLOY_DIR, 'packages'), { recursive: true });
fs.mkdirSync(path.join(DEPLOY_DIR, 'apps'), { recursive: true });

// Copy all packages
execSync(`cp -r ${PACKAGES_DIR}/* ${path.join(DEPLOY_DIR, 'packages')}/`);

// Copy dashboard app
execSync(`cp -r ${DASHBOARD_DIR} ${path.join(DEPLOY_DIR, 'apps')}/`);

// Process all package.json files
processPackageJsonFiles(DEPLOY_DIR);

// Create production package.json for the root
const rootPkg = {
  name: "midday-deploy",
  private: true,
  workspaces: [
    "packages/*",
    "apps/*"
  ],
  scripts: {
    "build": "turbo build --filter=@midday/dashboard",
    "start": "cd apps/dashboard && npm start"
  },
  dependencies: {
    "turbo": "2.3.3"
  },
  packageManager: "npm@10.x"
};

// Write production package.json
fs.writeFileSync(
  path.join(DEPLOY_DIR, 'package.json'),
  JSON.stringify(rootPkg, null, 2)
);

// Create .npmrc file
const npmrcPath = path.join(DEPLOY_DIR, '.npmrc');
fs.writeFileSync(npmrcPath, 'legacy-peer-deps=true\nstrict-peer-deps=false\n');

console.log('Deploy directory prepared at:', DEPLOY_DIR);
