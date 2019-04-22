# Coverage

## Packages outside of scope

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

## TODO

These either happen in private API, aren't relevant, or are pending of decission.

- [ ] go undocummented: `unstable__*`
- [ ] `constants` keycodes
- [ ] `{?{ time: number, count: number }}`packages/editor/src/store/selectors.js
- [ ] `{type=}` packages/block-library/src/image/edit.js
- [ ] `@api` packages/editor/src/editor-styles/ast/stringify/compiler.js
- [ ] `@callback` packages/components/src/autocomplete/index.js
- [ ] `@cite` packages/block-serialization-default-parser/src/index.js
- [ ] `@class` packages/edit-post/src/hooks/components/media-upload/index.js
- [ ] `@const` packages/editor/src/editor-styles/transforms/wrap.js
- [ ] `@constant` packages/editor/src/hooks/align.js
- [ ] `@constructor` packages/edit-post/src/hooks/components/media-upload/index.js
- [ ] `@inheritdoc` packages/edit-post/src/components/meta-boxes/meta-boxes-area/index.js
- [ ] `@private` packages/editor/src/components/rich-text/index.js
- [ ] `@property` babel-plugin-import-jsx-pragma
- [ ] `@since` packages/block-serialization-default-parser/src/index.js
- [ ] `@throws` packages/blocks/src/api/node.js
- [ ] `@typedef` packages/blocks/src/api/registration.js

## DONE

- [x] a11y
- [x] annotations
- [x] api-fetch
- [x] babel-plugin-import-jsx-pragma
- [x] blob
- [x] block-library
- [x] block-serialization-default-parser
- [x] block-serialization-spec-parser
- [x] blocks
- [x] components
- [x] compose
- [x] core-data
- [x] data
- [x] date
- [x] deprecated
- [x] dom
- [x] dom-ready
- [x] e2e-test-utils
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
- [x] rich-text
- [x] shortcode
- [x] token-list
- [x] url
- [x] viewport
- [x] wordcount
