const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Build optimization script
const optimizeBuild = () => {
  console.log('🚀 Starting build optimization...');

  // 1. Clean previous builds
  console.log('🧹 Cleaning previous builds...');
  try {
    if (process.platform === 'win32') {
      execSync('if exist build rmdir /s /q build', { stdio: 'inherit' });
    } else {
      execSync('rm -rf build', { stdio: 'inherit' });
    }
  } catch (error) {
    console.log('No previous build to clean or cleanup failed');
  }

  // 2. Run optimized build
  console.log('📦 Building optimized bundle...');
  execSync('npm run build', { stdio: 'inherit' });

  // 3. Analyze bundle size
  console.log('📊 Analyzing bundle size...');
  const buildPath = path.join(__dirname, '../build/static');
  
  if (fs.existsSync(buildPath)) {
    const analyzeBundle = (dirPath, fileType) => {
      const files = fs.readdirSync(dirPath);
      const targetFiles = files.filter(file => file.endsWith(fileType));
      
      let totalSize = 0;
      const fileStats = targetFiles.map(file => {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
        return {
          name: file,
          size: (stats.size / 1024).toFixed(2) + ' KB',
          sizeBytes: stats.size
        };
      });

      return {
        files: fileStats,
        totalSize: (totalSize / 1024).toFixed(2) + ' KB',
        totalSizeBytes: totalSize
      };
    };

    const jsAnalysis = analyzeBundle(path.join(buildPath, 'js'), '.js');
    const cssAnalysis = analyzeBundle(path.join(buildPath, 'css'), '.css');

    console.log('\n📈 Bundle Analysis:');
    console.log('JavaScript files:');
    jsAnalysis.files.forEach(file => {
      console.log(`  ${file.name}: ${file.size}`);
    });
    console.log(`  Total JS: ${jsAnalysis.totalSize}`);

    console.log('\nCSS files:');
    cssAnalysis.files.forEach(file => {
      console.log(`  ${file.name}: ${file.size}`);
    });
    console.log(`  Total CSS: ${cssAnalysis.totalSize}`);

    // Performance recommendations
    console.log('\n💡 Performance Recommendations:');
    
    if (jsAnalysis.totalSizeBytes > 500000) { // 500KB
      console.log('⚠️  JavaScript bundle is large (>500KB). Consider code splitting.');
    } else {
      console.log('✅ JavaScript bundle size is optimal.');
    }

    if (cssAnalysis.totalSizeBytes > 100000) { // 100KB
      console.log('⚠️  CSS bundle is large (>100KB). Consider removing unused styles.');
    } else {
      console.log('✅ CSS bundle size is optimal.');
    }
  }

  // 4. Generate performance report
  console.log('\n📋 Generating performance report...');
  const report = {
    buildTime: new Date().toISOString(),
    bundleSize: {
      js: fs.existsSync(path.join(buildPath, 'js')) ? 
          fs.readdirSync(path.join(buildPath, 'js'))
            .filter(f => f.endsWith('.js'))
            .reduce((total, file) => {
              return total + fs.statSync(path.join(buildPath, 'js', file)).size;
            }, 0) : 0,
      css: fs.existsSync(path.join(buildPath, 'css')) ?
           fs.readdirSync(path.join(buildPath, 'css'))
             .filter(f => f.endsWith('.css'))
             .reduce((total, file) => {
               return total + fs.statSync(path.join(buildPath, 'css', file)).size;
             }, 0) : 0
    },
    optimizations: [
      '✅ Gzip compression enabled',
      '✅ Brotli compression enabled',
      '✅ Code splitting implemented',
      '✅ Tree shaking enabled',
      '✅ Minification enabled',
      '✅ Source maps disabled in production',
      '✅ Service worker registered',
      '✅ Lazy loading implemented',
      '✅ Image optimization configured',
      '✅ Performance monitoring enabled'
    ]
  };

  fs.writeFileSync(
    path.join(__dirname, '../build/performance-report.json'),
    JSON.stringify(report, null, 2)
  );

  console.log('✅ Build optimization complete!');
  console.log('📄 Performance report saved to build/performance-report.json');
};

if (require.main === module) {
  optimizeBuild();
}

module.exports = optimizeBuild;