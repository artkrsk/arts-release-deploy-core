import * as esbuild from 'esbuild'

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

console.log('✅ Core package bundled successfully')
