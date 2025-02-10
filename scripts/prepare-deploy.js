const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Paths
const ROOT_DIR = path.resolve(__dirname, '..');
const DASHBOARD_DIR = path.join(ROOT_DIR, 'apps/dashboard');
const DEPLOY_DIR = path.join(ROOT_DIR, 'deploy');
const PACKAGES_DIR = path.join(ROOT_DIR, 'packages');

// Create fresh deploy directory
if (fs.existsSync(DEPLOY_DIR)) {
  fs.rmSync(DEPLOY_DIR, { recursive: true });
}
fs.mkdirSync(DEPLOY_DIR);

// Copy dashboard files
execSync(`cp -r ${DASHBOARD_DIR}/* ${DEPLOY_DIR}/`);

// Read dashboard package.json
const pkgPath = path.join(DEPLOY_DIR, 'package.json');
const pkg = require(pkgPath);

// Function to get package version
function getPackageVersion(pkgName) {
  const pkgDir = path.join(PACKAGES_DIR, pkgName.replace('@midday/', ''));
  const pkgJsonPath = path.join(pkgDir, 'package.json');
  if (fs.existsSync(pkgJsonPath)) {
    return require(pkgJsonPath).version;
  }
  return null;
}

// Resolve workspace dependencies
if (pkg.dependencies) {
  Object.entries(pkg.dependencies).forEach(([name, version]) => {
    if (version === 'workspace:*') {
      const resolvedVersion = getPackageVersion(name);
      if (resolvedVersion) {
        // Copy package to deploy directory
        const pkgDir = path.join(PACKAGES_DIR, name.replace('@midday/', ''));
        const targetDir = path.join(DEPLOY_DIR, 'node_modules', name);
        fs.mkdirSync(targetDir, { recursive: true });
        execSync(`cp -r ${pkgDir}/* ${targetDir}/`);
        
        // Update version in package.json
        pkg.dependencies[name] = resolvedVersion;
      }
    }
  });
}

// Write updated package.json
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

console.log('Deploy directory prepared at:', DEPLOY_DIR);
