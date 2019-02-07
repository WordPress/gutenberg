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

Fix JSDoc manually:

- [ ] rich-text `concat` type `@param` is `{...[object]}`
- [ ] autop `description` contains HTML

WIP:

- [ ] rich-text `toHTMLString` `@param` is an object (create table?)

TODO:

- [ ] blocks `pastHandler` has optional `@param`
- [ ] blocks `unstable__*` should this be docummented?
- [ ] date `format`, `date` have a null `@param`.type
- [ ] e2e-test-utils `mockOrTransform` contains undefined as a `@param`.type
- [ ] e2e-test-utils `setUpResponseMocking` has example mixed with description
- [ ] keycodes `CONSTANTS`
- [ ] rich-text `indentListItems` has `@param`.description = null
- [ ] rich-text `LINE_SEPARATOR` is a constant
- [ ] rich-text `unstableToDom` is this supposed to go undocumented?
- [ ] shortcode `string` has `@param`.description = null

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
- [x] deprecated
- [x] dom
- [x] dom-ready
- [x] edit-post
- [x] editor
- [x] element
- [x] escape-html
- [x] format-library
- [x] hooks
- [x] html-entities
- [x] i18n
- [x] jest-console
- [x] jest-puppeteer-axe
- [x] keycodes
- [x] list-reusable-blocks
- [x] notices
- [x] nux
- [x] plugins
- [x] priority-queue
- [x] redux-routine
- [x] token-list
- [x] url
- [x] viewport
- [x] wordcount