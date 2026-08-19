import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import importX from 'eslint-plugin-import-x';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ['dist/', 'coverage/', 'node_modules/'],
  },
  {
    // 循環依存の機械的検出（20260819 の申し送り M-5）
    files: ['src/**/*.ts', 'tests/**/*.ts'],
    plugins: { 'import-x': importX },
    settings: {
      'import-x/resolver-next': [createTypeScriptImportResolver()],
      // .ts を依存グラフの解析対象にする（無いと no-cycle が .ts を辿らず沈黙する）
      'import-x/extensions': ['.ts'],
    },
    rules: {
      'import-x/no-cycle': 'error',
    },
  },
  {
    // src/game/ は純粋レイヤー: ライブラリ・DOM・他レイヤーへの依存を禁止する
    files: ['src/game/**/*.ts', 'src/types/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['three', 'three/*', '@dimforge/*'],
              message:
                'src/game/・src/types/ から描画・物理ライブラリを import してはいけない（レイヤー純粋性）',
            },
            {
              group: ['**/ui/**', '**/engine/**'],
              message: 'src/game/・src/types/ から上位レイヤーを import してはいけない',
            },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'document', message: 'src/game/ で DOM を使わない（レイヤー純粋性）' },
        { name: 'window', message: 'src/game/ で DOM を使わない（レイヤー純粋性）' },
      ],
      'no-restricted-properties': [
        'error',
        {
          object: 'Math',
          property: 'random',
          message: 'src/game/random.ts のシード付き乱数を使う',
        },
        { object: 'Date', property: 'now', message: 'ゲームロジックを実時間に依存させない' },
      ],
    },
  },
  {
    // ui は engine を、engine は ui を import しない
    files: ['src/ui/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['**/engine/**'], message: 'ui から engine へ依存しない（結線は main.ts）' },
            {
              group: ['three', 'three/*', '@dimforge/*'],
              message: 'ui から描画・物理ライブラリを直接使わない（engine レイヤーの責務）',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/engine/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['**/ui/**'], message: 'engine から ui へ依存しない（結線は main.ts）' },
          ],
        },
      ],
    },
  },
);
