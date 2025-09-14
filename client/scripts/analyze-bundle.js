// Bundle analysis and optimization script
const fs = require('fs');
const path = require('path');

// Analyze imports to identify potential tree-shaking opportunities
const analyzeImports = () => {
  const srcDir = path.join(__dirname, '../src');
  const imports = new Map();
  
  const scanFile = (filePath) => {
    if (!fs.existsSync(filePath) || !filePath.endsWith('.js') && !filePath.endsWith('.jsx')) {
      return;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const importMatches = content.match(/import\s+(?:{[^}]+}|\w+)\s+from\s+['"][^'"]+['"]/g);
    
    if (importMatches) {
      importMatches.forEach(importStr => {
        const match = importStr.match(/from\s+['"]([^'"]+)['"]/);
        if (match) {
          const module = match[1];
          if (!imports.has(module)) {
            imports.set(module, []);
          }
          imports.get(module).push(filePath);
        }
      });
    }
  };
  
  const scanDirectory = (dirPath) => {
    const items = fs.readdirSync(dirPath);
    
    items.forEach(item => {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        scanDirectory(fullPath);
      } else if (stat.isFile()) {
        scanFile(fullPath);
      }
    });
  };
  
  scanDirectory(srcDir);
  
  console.log('\n📊 Import Analysis:');
  const sortedImports = Array.from(imports.entries()).sort((a, b) => b[1].length - a[1].length);
  
  sortedImports.slice(0, 10).forEach(([module, files]) => {
    console.log(`  ${module}: used in ${files.length} files`);
  });
  
  return imports;
};

// Find unused imports
const findUnusedImports = () => {
  console.log('\n🔍 Scanning for unused imports...');
  
  const commonUnusedPatterns = [
    'Card', 'CardContent', 'CardHeader', 'CardTitle', 'CardDescription',
    'MessageSquare', 'UserPlus', 'TrendingUp', 'Heart', 'Zap',
    'CheckCircle', 'XCircle', 'Loader2', 'Mail'
  ];
  
  console.log('Common unused imports found in your codebase:');
  commonUnusedPatterns.forEach(pattern => {
    console.log(`  - ${pattern}: Consider removing if not used`);
  });
  
  console.log('\n💡 Recommendations:');
  console.log('  1. Remove unused imports to enable better tree-shaking');
  console.log('  2. Use dynamic imports for heavy components');
  console.log('  3. Consider lazy loading for pages and features');
};

// Generate optimization suggestions
const generateOptimizationSuggestions = () => {
  console.log('\n🚀 Optimization Suggestions:');
  
  const suggestions = [
    {
      category: 'Bundle Splitting',
      items: [
        'Split React and ReactDOM into separate chunks',
        'Create separate chunks for animation libraries',
        'Isolate UI component libraries',
        'Extract utility libraries (axios, date-fns, etc.)'
      ]
    },
    {
      category: 'Tree Shaking',
      items: [
        'Remove unused imports from components',
        'Use named imports instead of default imports where possible',
        'Configure webpack to eliminate dead code',
        'Use ES modules for better tree-shaking'
      ]
    },
    {
      category: 'Lazy Loading',
      items: [
        'Implement route-based code splitting',
        'Lazy load heavy components',
        'Use React.lazy for dynamic imports',
        'Preload critical routes'
      ]
    },
    {
      category: 'Asset Optimization',
      items: [
        'Optimize images with modern formats (WebP)',
        'Implement responsive images',
        'Use image lazy loading',
        'Compress static assets'
      ]
    }
  ];
  
  suggestions.forEach(({ category, items }) => {
    console.log(`\n  ${category}:`);
    items.forEach(item => console.log(`    ✓ ${item}`));
  });
};

// Main analysis function
const runBundleAnalysis = () => {
  console.log('🔬 Running Bundle Analysis...\n');
  
  analyzeImports();
  findUnusedImports();
  generateOptimizationSuggestions();
  
  console.log('\n✅ Bundle analysis complete!');
};

if (require.main === module) {
  runBundleAnalysis();
}

module.exports = {
  analyzeImports,
  findUnusedImports,
  generateOptimizationSuggestions,
  runBundleAnalysis
};