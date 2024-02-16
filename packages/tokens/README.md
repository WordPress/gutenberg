# Tokens

This module provides the functionality necessary to implement a dynamic-token replacement system.
Dynamic tokens are simple and non-nested markers within a document that refer to externally-sourced data.
On page render they are to be replaced with some server-side function.
During edit sessions they should appear visually as tokens and not as their replaced values.
Tokens should be replaced with basic textual content.

## Usage

Because tokens are designed to support human entry their syntax is more flexible than block comment delimiters.
There are multiple ways to enter tokens that have different levels of convenience for the varying amounts of their required information.

### Token properties

| Name | Data Type | Description |
|---|---|---|
| `token` | Identifier | Indicates the `name` of a token as its `namespace`, or `core` if the namespace is omitted. e.g. `featured-image` or `my-plugin/weather`. |
| `value` | `any` | Data passed to token rendering function as an argument. Some tokens might need more than just a name to properly render. e.g. `{"stat": "temperature", "unit": "C"}` |
| `fallback` | `string` | Plaintext string to render in place of the token if no suitable renderer is avialable. This may occur after uninstalling a plugin or when importing content from another site. Without a fallback tokens will be removed from the document to prevent leaking internal or private information. |

### Token sytnax

Choosing an appropriate token syntax is mostly an exercise in determining how much information is necessary to render the token.
The more data we need, the more sytnax we also need.
Likewise the less data we need to convey, the terser we can write the token.

#### Namespacing and the `core` namespace

Tokens are identified by their `namespace` and `name` pair.
For example, `my-plugin/weather` identifies the `weather` token in the `my-plugin` namespace.
Typically the `namespace` corresponds to the WordPress plugin which registered the token.
The `core` namespace is special and represents the functionality built in to WordPress.
It's possible to omit the `core/` namespace prefix when identifying a token.
Likewise, if a token lacks a namespace it's implied to be provided in the `core` namespace.

#### Simple tokens

Tokens that don't require any arguments can be entered with their unescaped names.

| Syntax | Meaning                                   |
|---|-------------------------------------------|
| `#{featured-image}#` | Display the `core/featured-image` token |
| `#{core/featured-image}#` | Display the `core/featured-iamge}` token |
| `#{retro/page-counter}#` | Display the `retro/page-counter` token |


#### Simple tokens with arguments

If your token needs additional information in order to properly render you can pass them in as augmented JSON.

| Syntax | Meaning                                   |
|---|-------------------------------------------|
| `#{permalink=14}#` | Display the permalink for the post whose id is 14 |
| `#{my-plugin/weather={"stat": "temperature", "units": "C"}}#` | Display the temperature in ºC |
| `#{echo="\u{3c}span\u{3e}\u{23}1\u{3c}/span\u{3e}"}#` | Render `<span>#1</span>` |

#### Tokens with fallback

If a token provides a fallback value it must use the fully-verbose syntax.
It's always possible to use the full syntax.

| Syntax | Meaning                                   |
|---|-------------------------------------------|
| `#{"token":"sportier/stat", "value":{"sport": "basketball", "game": "latest"}, "fallback": "TBD"}}#` | Show the score for the latest basketball game, but the plugin isn't available render `TBD` instead. |

#### Indicating context for token

While not currently supported, it may arise that we need to indicate in which context the token is found.
This is due to the fact that there are different escaping and security concerns for content bound for HTML attributes than there are for those bound for HTML markup, similarly for other potential contexts.

Tokens support indicating this with a _sigil_ at the front of the token syntax according to the following table.
Not all potential sigils are meaningful, and in the absence of a recognized sigil the context for a token remains blank  (`null`).

| Sigil | Associated context                                     |
|---|--------------------------------------------------------|
| `a` | token is inside an HTML attribute                      |
| `h` | token is inside normal HTML markup                     |
| `j` | token is inside a `<script>` tag or in JavaScript code |

The context is a hint to the backend on how to render and escape the token content.
It's not yet decided if these will be enforced by the token system or left up to the token authors to enforce.

## Background
