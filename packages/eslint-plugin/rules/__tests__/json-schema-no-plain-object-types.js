/**
 * External dependencies
 */
import { RuleTester } from 'eslint';

/**
 * Internal dependencies
 */
import rule from '../json-schema-no-plain-object-types';

const ruleTester = new RuleTester( {
	parserOptions: {
		ecmaVersion: 6,
	},
} );

const UNSPECIFIED_OBJECT_ERROR =
	"Any object within a block's attributes must have its properties defined.";

ruleTester.run( 'json-schema-no-plain-object-types', rule, {
	valid: [
		{
			code: `
( {
    "name": "my/gallery",
    "category": "widgets",
    "attributes": {
        "images": {
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
} )
`,
		},
		{
			code: `
( {
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
} )
`,
		},
		{
			code: `
( {
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
} )
`,
		},
	],
	invalid: [
		{
			code: `
( {
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
} )
`,
			errors: [ { message: UNSPECIFIED_OBJECT_ERROR } ],
		},
		{
			code: `
( {
    "name": "my/gallery",
    "category": "widgets",
    "attributes": {
        "images": {
            "type": "object"
        }
    }
} )
`,
			errors: [ { message: UNSPECIFIED_OBJECT_ERROR } ],
		},
	],
} );
