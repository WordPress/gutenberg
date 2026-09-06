# Schemas

The collection of schemas used in WordPress, including the `theme.json`, `block.json`, `font-collection.json`, and `wp-env.json` schemas.

JSON schemas are used by code editors to offer tooltips, autocomplete, and validation.

## What a schema does and does not check

A schema checks the _shape_ of a file, not whether that file does anything in the system. In that way, the schema is deliberately more permissive than WordPress itself.

Take `theme.json`. Three sets, each contained in the one above it:

```
+- validates against the schema -------------------+
|  +- WordPress keeps it -----------------------+  |
|  |  +- outputs CSS or a setting -----------+  |  |
|  |  +--------------------------------------+  |  |
|  +--------------------------------------------+  |
+--------------------------------------------------+
```

The schema is the widest ring on purpose. JSON Schema can check key names, types, enums and string patterns. It cannot run WordPress, and it cannot tell whether a string is valid CSS. So a file can validate and still be rejected or ignored when it is read.

## Changing a schema

### Requirements

-   **If it works, the schema must accept it.** Marking a key invalid when the code that reads the file acts on it is a bug. Fix the schema.
-   **The schema must not be the only place a rejection is explained.** If the code drops or ignores a value, say so where the author will see it. In PHP that means `_doing_it_wrong()` or a notice. Don't rely on an editor squiggle nobody sees.

### Suggestions

These are for clarity, not hard rules.

-   **Say when a value is CSS.** If a string has to be valid CSS source text, write that in the description. Nothing else will catch it.
-   **Disambiguate similar keys.** Two keys with the same name in different places need descriptions that tell them apart, not the same sentence twice. `fontFamilies[].fontFamily` takes a comma-separated list; `fontFamilies[].fontFace[].fontFamily` takes a single family name. The types are identical, so only the description can tell you which is which.
-   **Break descriptions into lines with `\n`.** A single long paragraph is unreadable in a hover.

Example:

```json
{
	"fontFamily": {
		"description": "CSS @font-face font-family descriptor: a single font family name, not the comma-separated list the CSS font-family property takes.\n\nQuoting is recommended. JSON quotes the string and CSS quotes the name inside it, so write \"Source Serif Pro\", quotes included.",
		"type": "string",
		"default": ""
	}
}
```

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

Or in your `font-collection.json`:

```json
{
	"$schema": "https://schemas.wp.org/trunk/font-collection.json"
}
```

Or in your `.wp-env.json`:

```json
{
	"$schema": "https://schemas.wp.org/trunk/wp-env.json"
}
```

For a specific version of the schema, replace `trunk` with `wp/X.X`:

```json
{
	"$schema": "https://schemas.wp.org/wp/5.8/block.json"
}
```

Visual Studio Code and PhpStorm are two popular editors that work out of the box. However, some editors require a plugin installed, and not all editors recognize the `$schema` property. Check your editor's documentation for details. Additionally, [SchemaStore.org](https://www.schemastore.org/) and [JSON Schema](https://json-schema.org/tools) have lists of editors known to have support if your current editor is unsupported.

## Local Development

You may wish to update one of the schemas to conform to a new change in the structure. In order to do this you'll want to be able to see how your changes impact how your IDE displays schema information.

To allow this you will need to:

-   update your theme's `theme.json` to reference the _local_ version of the schema file:

```json
{
	"$schema": "file://{{FULL_FILE_PATH}}/schemas/json/theme.json"
}
```

-   update your block's `block.json` to include:

```json
{
	"$schema": "file://{{FULL_FILE_PATH}}/schemas/json/block.json"
}
```

-   update your font collections's `font-collection.json` to include:

```json
{
	"$schema": "file://{{FULL_FILE_PATH}}/schemas/json/font-collection.json"
}
```

Be sure to replace `{{FULL_FILE_PATH}}` with the full local path to your Gutenberg repo.

With this in place you should now be able to edit either `schemas/json/theme .json`, `schemas/json/block.json` or `schemas/json/font-collection.json` in order to see changes reflected in `theme.json`, `block.json` or `font-collection.json` in your IDE.

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
