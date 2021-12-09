# Schemas

The collection of schemas used in WordPress, including the `theme.json` schema, and `block.json` schemas.

## Usage

JSON schemas are used by code editors to offer tooltips, autocomplete, and validation. To use in your JSON file, add the `$schema` property to the top of the file with the value of the schema URL.

For example, in your `block.json` file you would add:

```json
{
	"$schema": "https://raw.githubusercontent.com/WordPress/gutenberg/trunk/schemas/json/block.json"
}
```

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
