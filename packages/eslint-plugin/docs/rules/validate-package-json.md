# Validate package.json (validate-package-json)

Validates **package.json** files using the WordPress `npm-package-json-lint` configuration. This rule ensures package.json files follow WordPress coding standards and best practices.

## Rule Details

This rule:

- Validates package.json structure and content
- Enforces property ordering
- Ensures dependencies are sorted alphabetically
- Validates required fields (name, version, description, author, license, etc.)
- Supports auto-fixing for ordering and formatting issues

The rule uses [@wordpress/npm-package-json-lint-config](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-npm-package-json-lint-config/) under the hood.

## Usage

### Basic Usage

The `package-json-lint` preset automatically enables this rule for `package.json` files:

```json
{
	"extends": ["plugin:@wordpress/eslint-plugin/package-json-lint"]
}
```

**Note:** When using this preset alongside other presets (like `recommended` or `recommended-with-formatting`), you need to configure the JSON parser in an override to prevent conflicts:

```json
{
	"extends": [
		"plugin:@wordpress/eslint-plugin/recommended-with-formatting",
		"plugin:@wordpress/eslint-plugin/package-json-lint"
	],
	"overrides": [
		{
			"files": ["package.json"],
			"parser": "jsonc-eslint-parser"
		}
	]
}
```

### Rule Options

You can override specific npm-package-json-lint rules using the `rules` option:

```json
{
	"overrides": [
		{
			"files": ["package.json"],
			"parser": "jsonc-eslint-parser",
			"rules": {
				"@wordpress/validate-package-json": [
					"error",
					{
						"rules": {
							"valid-values-license": "off",
							"require-homepage": "off"
						}
					}
				]
			}
		}
	]
}
```

## Examples

### Invalid

```json
{
	"version": "1.0.0",
	"name": "my-package",
	"dependencies": {
		"zebra": "^1.0.0",
		"alpha": "^2.0.0"
	}
}
```

Issues:
- Properties are not in the correct order (version before name)
- Dependencies are not sorted alphabetically

### Valid (after fix)

```json
{
	"name": "my-package",
	"version": "1.0.0",
	"dependencies": {
		"alpha": "^2.0.0",
		"zebra": "^1.0.0"
	}
}
```

## Configuration

### Available Rules

All rules from [@wordpress/npm-package-json-lint-config](https://github.com/WordPress/gutenberg/tree/trunk/packages/npm-package-json-lint-config) can be configured:

- `prefer-property-order` - Enforce property order
- `prefer-alphabetical-dependencies` - Sort dependencies
- `prefer-alphabetical-devDependencies` - Sort devDependencies
- `prefer-alphabetical-peerDependencies` - Sort peerDependencies
- `require-*` rules - Require specific fields
- `valid-values-*` rules - Validate field values
- And many more...

### Disabling Specific Checks

To disable specific checks for your project:

```json
{
	"overrides": [
		{
			"files": ["package.json"],
			"parser": "jsonc-eslint-parser",
			"rules": {
				"@wordpress/validate-package-json": [
					"error",
					{
						"rules": {
							"valid-values-license": "off",
							"require-homepage": "off",
							"require-keywords": "off"
						}
					}
				]
			}
		}
	]
}
```

## Auto-Fixing

Run ESLint with the `--fix` flag to automatically fix ordering issues:

```bash
eslint package.json --fix
```

## Related

- [@wordpress/npm-package-json-lint-config](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-npm-package-json-lint-config/)
- [npm-package-json-lint](https://npmpackagejsonlint.org/)
