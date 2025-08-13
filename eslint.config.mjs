import globals from "globals";
import eslintPluginJs from "@eslint/js";
import eslintPluginVue from "eslint-plugin-vue";
import oxlint from "eslint-plugin-oxlint";
// import VueEslintParser from "vue-eslint-parser";
import tsEslint from "typescript-eslint";

// import eslintConfigPrettier from "eslint-config-prettier";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
// import prettier from 'eslint-plugin-prettier';

/* @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ["src/*.{mjs,cjs,ts,vue}", "app/*.{mjs,cjs,ts,vue}", "electron/*.ts"],
    ignores: [".vscode", ".git", "node_modules", "dist", "output", "logs", "public"],
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: { parser: tsEslint.parser },
    },
  },
  // eslint.configs.recommended,
  /* js推荐配置 */
  eslintPluginJs.configs.recommended,
  /* ts推荐配置 */
  ...tsEslint.configs.recommended,
  /* vue推荐配置 */
  ...eslintPluginVue.configs["flat/recommended"],
  /* oxlint推荐配置 */
  oxlint.configs["flat/recommended"],
  /* 自定义eslint配置 */
  {
    rules: {
      "no-var": "error", // 要求使用 let 或 const 而不是 var
      "no-multiple-empty-lines": ["warn", { max: 1 }], // 不允许多个空行
      "no-unexpected-multiline": "error", // 禁止空余的多行
      "no-useless-escape": "off", // 禁止不必要的转义字符
      semi: "error",
      "prefer-const": "error",
      quotes: [1, "double"], //引号类型 `` "" ''
      "vue/multi-word-component-names": 0,
    },
  },

  /*
   * prettier 配置
   * 会合并根目录下的.prettier.config.js 文件
   * @see https://prettier.io/docs/en/options
   */
  // eslintConfigPrettier,
  eslintPluginPrettierRecommended,

  /**
   * vue 规则
   */
  {
    files: ["**/*.vue"],
    languageOptions: {
      parserOptions: {
        /* typescript项目需要用到这个 */
        parser: tsEslint.parser,
        ecmaVersion: "latest",
        /* 不允许在.vue 文件中使用 JSX */
        ecmaFeatures: {
          jsx: false,
        },
      },
    },
    rules: {
      // 在这里追加 vue 规则
      "vue/no-mutating-props": [
        "error",
        {
          shallowOnly: true,
        },
      ],
    },
  },

  /**
   * typescript 规则
   */
  {
    files: ["**/*.{ts,tsx,vue}"],
    rules: {},
  },
];
