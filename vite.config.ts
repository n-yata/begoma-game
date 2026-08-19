/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

/**
 * 本番ビルド向けの厳格 CSP。index.html 側の CSP は Vite 開発サーバー用の緩和
 * （style-src 'unsafe-inline'・connect-src ws:）を含むため、ビルド時に差し替える。
 * 'wasm-unsafe-eval' は Rapier(WASM) のインスタンス化に必須（外すと起動しない）
 */
const PROD_CSP =
  "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self'; " +
  "connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'self'; " +
  "form-action 'none'";

export default defineConfig({
  base: './',
  plugins: [
    {
      name: 'strict-csp-on-build',
      apply: 'build',
      transformIndexHtml(html) {
        return html.replace(
          /(http-equiv="Content-Security-Policy"[\s\S]*?content=")[^"]*(")/,
          `$1${PROD_CSP}$2`,
        );
      },
    },
  ],
  build: {
    target: 'es2022',
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/game/**'],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
    },
  },
});
