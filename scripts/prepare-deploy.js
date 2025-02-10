const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Paths
const ROOT_DIR = path.resolve(__dirname, '..');
const DASHBOARD_DIR = path.join(ROOT_DIR, 'apps/dashboard');
const DEPLOY_DIR = path.join(ROOT_DIR, 'deploy');

// Clean and create deploy directory
if (fs.existsSync(DEPLOY_DIR)) {
  fs.rmSync(DEPLOY_DIR, { recursive: true });
}
fs.mkdirSync(DEPLOY_DIR);

// Copy dashboard app files
execSync(`cp -r ${DASHBOARD_DIR}/* ${DEPLOY_DIR}/`);

// Get the dashboard's package.json
const dashboardPkg = require(path.join(DASHBOARD_DIR, 'package.json'));

// Get all local package versions
const getLocalPackageVersion = (packageName) => {
  const pkgPath = path.join(ROOT_DIR, 'packages', packageName.replace('@midday/', ''), 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = require(pkgPath);
    return pkg.version || '1.0.0';
  }
  return null;
};

// Create production package.json
const prodPkg = {
  name: dashboardPkg.name,
  version: dashboardPkg.version,
  private: true,
  engines: {
    "node": "20.x",
    "npm": "10.x"
  },
  scripts: {
    "build": dashboardPkg.scripts.build,
    "start": dashboardPkg.scripts.start
  },
  dependencies: {},
  devDependencies: {}
};

// Copy dependencies, resolving workspace references
Object.entries(dashboardPkg.dependencies || {}).forEach(([name, version]) => {
  if (version === 'workspace:*' && name.startsWith('@midday/')) {
    const localVersion = getLocalPackageVersion(name);
    if (localVersion) {
      prodPkg.dependencies[name] = localVersion;
      
      // Copy the local package to node_modules
      const packageDir = path.join(ROOT_DIR, 'packages', name.replace('@midday/', ''));
      const targetDir = path.join(DEPLOY_DIR, 'node_modules', '@midday', name.replace('@midday/', ''));
      fs.mkdirSync(targetDir, { recursive: true });
      execSync(`cp -r ${packageDir}/* ${targetDir}/`);
      
      // Update the copied package's package.json
      const pkgJsonPath = path.join(targetDir, 'package.json');
      if (fs.existsSync(pkgJsonPath)) {
        const pkg = require(pkgJsonPath);
        delete pkg.devDependencies;
        if (pkg.dependencies) {
          Object.entries(pkg.dependencies).forEach(([depName, depVersion]) => {
            if (depVersion === 'workspace:*') {
              const localDepVersion = getLocalPackageVersion(depName);
              if (localDepVersion) {
                pkg.dependencies[depName] = localDepVersion;
              } else {
                delete pkg.dependencies[depName];
              }
            }
          });
        }
        fs.writeFileSync(pkgJsonPath, JSON.stringify(pkg, null, 2));
      }
    }
  } else {
    prodPkg.dependencies[name] = version;
  }
});

// Write production package.json
fs.writeFileSync(
  path.join(DEPLOY_DIR, 'package.json'),
  JSON.stringify(prodPkg, null, 2)
);

// Create .npmrc file
const npmrcPath = path.join(DEPLOY_DIR, '.npmrc');
fs.writeFileSync(npmrcPath, 'legacy-peer-deps=true\nstrict-peer-deps=false\n');

console.log('Deploy directory prepared at:', DEPLOY_DIR);
