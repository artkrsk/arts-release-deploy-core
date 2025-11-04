import * as esbuild from 'esbuild'
import * as sass from 'sass'
import { writeFile, mkdir } from 'fs/promises'

// Bundle the ESM output
await esbuild.build({
  entryPoints: ['./src/index.ts'],
  bundle: true,
  format: 'esm',
  outfile: './dist/index.js',
  platform: 'browser',
  target: 'es2020',
  external: ['react', 'react-dom'],
  minify: false,
  sourcemap: false,
  treeShaking: true
})

// Compile SASS to CSS
console.log('🎨 Compiling SASS to CSS...')

try {
  const result = sass.compile('./src/styles/index.sass', {
    sourceMap: true,
    style: 'expanded',
    loadPaths: ['./src/styles']
  })

  // Ensure dist/styles directory exists
  await mkdir('./dist/styles', { recursive: true })

  // Write compiled CSS
  await writeFile('./dist/index.css', result.css)

  // Write source map
  if (result.sourceMap) {
    await writeFile('./dist/index.css.map', JSON.stringify(result.sourceMap))
  }

  console.log('✅ SASS compiled to CSS successfully')

  // List all loaded files for verification
  if (result.loadedUrls.length > 0) {
    console.log('📋 Compiled files:')
    result.loadedUrls.forEach(url => {
      console.log(`   - ${url.pathname}`)
    })
  }

} catch (error) {
  console.error('❌ SASS compilation failed:', error)
  process.exit(1)
}

console.log('✅ Core package built successfully')
