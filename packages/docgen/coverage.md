# Coverage

Packages outside of scope:

- babel-plugin-makepot. CommonJS module. Babel plugin.
- babel-preset-default. CommonJS module. Babel preset.
- browserslist-config. CommonJS module. Config.
- custom-templated-path-webpack-plugin. CommonJS module. Webpack plugin.
- docgen. CommonJS module.
- e2e-tests. Do not export anything.
- eslint-plugin. CommonJS module. ESLint plugin.
- is-shallow-equal. CommonJS module.
- jest-preset-default. CommonJS module. Jest preset.
- library-export-default-webpack-plugin. CommonJS. Webpack plugin.
- npm-package-json-lint-config. CommonJS. Config.
- postcss-themes. CommonJS module.
- scripts. CommonJS module.

TODO:

- [ ] autop - description contains HTML
- [ ] blocks
  - [ ] `getBlockSupport`, `isValidIcon`, `parseWithAttributeSchema` have `*` as param.type
  - [ ] `pastHandler` has optional params
  - [ ] `setCategories` has `Object []` as a param type
  - [ ] `unstable__*` should this be docummented?
- [ ] date - `format`, `date` have a null param.type
- [ ] deprecated - missing `@type` tag
- [ ] e2e-test-utils
  - [ ] `mockOrTransform` contains undefined as a param.type
  - [ ] `setUpResponseMocking` has long description mixed with example
- [ ] editor - `userMentionsCompleter` - missing `@type` tag
- [ ] element - `isEmptyElement` has `*` as param.type
- [ ] escape-html - missing `@link` tag `escapeAttribute`
- [ ] i18n - `sprintf` has `string[]` as a param type
- [ ] keycodes - has constants, missing `@type` tag
- [ ] rich-text
  - [ ] `concat` type param is `{...[object]}`
  - [ ] `indentListItems` has param.description = null
  - [ ] `LINE_SEPARATOR` is a constant
  - [ ] `toHTMLString` a param is an object (create table?)
  - [ ] `unstableToDom` is this supposed to go undocumented?
- [ ] shortcode
  - [ ] `string` has param.description = null
  - [ ] description contains numbered list that is flattened
- [ ] token-list - missing `@link` tag

DONE:

- [x] a11y
- [x] annotations
- [x] api-fetch
- [x] babel-plugin-import-jsx-pragma
- [x] blob
- [x] block-library
- [x] block-serialization-default-parser
- [x] block-serialization-spec-parser
- [x] components
- [x] compose
- [x] core-data
- [x] data
- [x] dom
- [x] dom-ready
- [x] edit-post
- [x] format-library
- [x] hooks
- [x] html-entities
- [x] jest-console
- [x] jest-puppeteer-axe
- [x] list-reusable-blocks
- [x] notices
- [x] nux
- [x] plugins
- [x] priority-queue
- [x] redux-routine
- [x] url
- [x] viewport
- [x] wordcount