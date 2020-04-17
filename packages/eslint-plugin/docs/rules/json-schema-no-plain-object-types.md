# Require all "object" types within a block's attributes to define their expected properties (json-schema-no-plain-object-types)

Block attributes must conform to types as specified in the [WordPress REST API documentation](https://developer.wordpress.org/rest-api/extending-the-rest-api/schema/), a behavior based on [JSON Schema](http://json-schema.org/). This schema is used to validate attribute data not only in the REST API, but [also in the block editor](https://developer.wordpress.org/block-editor/developers/block-api/block-attributes/#attribute-type-validation).

This rule requires that any declaration of an `object` type specify the exact properties that make up the object. This applies to the type of attributes themselves as well as any data within an attribute, such as when an attribute of type `array` expects values of type `object`.

## Rule details

Examples of **incorrect** code for this rule:

```js
{
    "name": "my/gallery",
    "category": "widgets",
    "attributes": {
        "images": {
            "type": "object"
        }
    }
}
```

```js
{
    "name": "my/gallery",
    "category": "widgets",
    "attributes": {
        "images": {
            "type": "array",
            "items": {
                "type": "object"
            }
        }
    }
}
```

Examples of **correct** code for this rule:

```js
{
    "name": "my/gallery",
    "category": "widgets",
    "attributes": {
        "images": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {
                        "type": "number"
                    },
                    "width": {
                        "type": "number"
                    }
                }
            }
        }
    }
}
```

```js
{
    "name": "my/gallery",
    "category": "widgets",
    "attributes": {
        "images": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {
                        "type": "number"
                    },
                    "width": {
                        "type": "number"
                    }
                },
                "required": [
                    "id", "width"
                ],
                "additionalProperties": false
            }
        }
    }
}
```
