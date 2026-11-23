# Block attribute types

Block attribute types and the Field API types in `@wordpress/dataviews` are the same thing. A type that exists in both means the same in both, and the editor can build a control for an attribute from its type.

## Why not JSON Schema

JSON Schema describes the shape of data. Block attributes and fields also drive UI: which control to show, how to filter, how to check a value while someone edits it. JSON Schema has no words for most of that, so the Field API grew its own types, and block attributes follow them.

Block attributes were never strict JSON Schema anyway: `rich-text`, `source`, `selector` and `query` aren't part of it.

## Where JSON Schema still applies

The server checks attribute values with the REST API's JSON Schema code. Before that check, WordPress maps each type that isn't in JSON Schema:

| Attribute type | Checked as |
| --- | --- |
| `datetime` | `string`, `format: date-time` |
| `url` | `string`, `format: uri` |

The REST API and the Abilities API stay JSON Schema.

## Adding a type

A type in `block.json` is a public API: once a block uses it, it can't change. So:

-   Add a type only when a block needs it, and only if the Field API already has it with the same meaning.
-   Add its JSON Schema mapping in the same change.
-   Today's set is `datetime` and `url`.
