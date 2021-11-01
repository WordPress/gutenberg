# Schemas

The collection of schemas used in WordPress, including the `theme.json` schema, and `block.json` schemas.

## Usage

JSON schemas are used by code editors to offer tooltips, autocomplete, and validation. To use in your JSON file, add the `$schema` property to the top of the file with the value of the schema URL.

For example, in your `block.json` file you would add:

```json
{
	"$schema": "https://raw.githubusercontent.com/WordPress/gutenberg/trunk/packages/schemas/json/block.json"
}
```

## SchemaStore.org

[SchemaStore.org](https://schemastore.org) is an open collection of schemas, including the WordPress `theme.json` and `block.json` schemas. Any changes to schemas in this package should be mirror there.

To update on SchemaStore, create a PR at their repository [SchemaStore/schemastore](https://github.com/SchemaStore/schemastore/). The files can be found in their reposiory at:

-   block.json: `src/schemas/json/block.json`
-   theme.json: `src/schemas/json/theme-v1.json`

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
