// `import x from 'foo.mdx?raw'` returns the file contents as a string.
// Webpack rule: see next.config.ts (asset/source on *.mdx?raw).
declare module '*.mdx?raw' {
  const contents: string;
  export default contents;
}

declare module '*.md?raw' {
  const contents: string;
  export default contents;
}
