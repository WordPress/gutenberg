# Schemas

The collection of schemas used in WordPress, including the `theme.json` and `block.json` schemas.

JSON schemas are used by code editors to offer tooltips, autocomplete, and validation.

## JSON schema usage

Many editors recognize the `$schema` property in JSON files.

Update your `block.json` to include:

```json
{
	"$schema": "https://schemas.wp.org/trunk/block.json"
}
```

Or in your `theme.json`:

```json
{
	"$schema": "https://schemas.wp.org/trunk/theme.json"
}
```

For a specific version of the schema, replace `trunk` with `wp/X.X`:

```json
{
	"$schema": "https://schemas.wp.org/wp/5.8/block.json"
}
```

Visual Studio Code and PhpStorm are two popular editors that work out of the box. However, some editors require a plugin installed, and not all editors recognize the `$schema` property. Check your editor's documentation for details. Additionally, [SchemaStore.org](https://www.schemastore.org/) and [JSON Schema](https://json-schema.org/implementations.html#editors) have lists of editors known to have support if your current editor is unsupported.

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
