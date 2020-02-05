## Master

## 0.6.0 (2020-02-04)

### Enhancements

- Removed the code that clears the terminal while the block is scaffolded ([#19867](https://github.com/WordPress/gutenberg/pull/19867)).

### Bug Fixes

- Use the description provided to fill the `description` field in `package.json` file in ESNext template ([#19867](https://github.com/WordPress/gutenberg/pull/19867)).
- Ensure that values provided for slug and namespace get converted to lower case ([#19867](https://github.com/WordPress/gutenberg/pull/19867)).

### Internal

- Relocated npm packge from `create-wordpress-block` to `@wordpress/create-block` ([#19773](https://github.com/WordPress/gutenberg/pull/19773)).

## 0.5.0 (2020-01-08)

### New Features

- Update templates to include WordPress plugin metadata by default.

## 0.4.3 (2020-01-08)

### Bug Fix

- Print available commands only for ESNext template.

## 0.4.0 (2019-12-17)

### New Features

- Add full support for ESNext template, including `wp-scripts` bootstrapping.

### Enhancements

- Improve the feedback shared on the console while scaffolding a block.

## 0.3.2 (2019-12-16)

### Bug Fix

- Fix the paths pointing to the JS build file listed in PHP file in the ESNext template.

## 0.3.0 (2019-12-16)

### New Features

- Added support for template types. `esnext` becomes the default one. `es5` is still available as an option.
