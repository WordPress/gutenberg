# Style Runtime

Runtime helpers for registering styles and injecting them into one or more documents.

CSS module imports are evaluated as JavaScript module side effects. By default,
that means generated style tags are inserted into the root document. This works
for most screens, but it does not cover styles for components rendered inside
another document, such as an iframe canvas.

`@wordpress/style-runtime` keeps a shared registry of style text and target
documents. Build tooling can register compiled styles when CSS modules are
imported, while host components can register additional documents that should
receive those styles.

## Usage

Generated CSS module output registers styles with a stable hash:

```js
import { registerStyle } from '@wordpress/style-runtime';

registerStyle( 'style-hash', '.example{color:red;}' );
```

Hosts that render package components into another document register that
document as a style target:

```js
import { registerDocument } from '@wordpress/style-runtime';

const unregisterDocument = registerDocument( iframe.contentDocument );

// Later, when the document is no longer used:
unregisterDocument();
```

When a document is registered, all previously registered styles are injected
into it. Future styles are injected into every registered document.

The runtime coordinates separately bundled copies of this package through a
reserved `globalThis.__wpStyleRuntime` object. Consumers should use the public
APIs below instead of reading or writing that global directly.

## API

### `registerStyle`

Registers CSS text under a stable hash and injects it into all registered
documents. The hash is used to deduplicate style tags, so the same style is not
inserted more than once per document.

Registered styles are retained for the lifetime of the page so they can be
replayed into documents that are registered later.

```js
import { registerStyle } from '@wordpress/style-runtime';

registerStyle( 'style-hash', '.example{color:red;}' );
```

### `registerDocument`

Registers a document as a style injection target and returns a cleanup
function. Documents are reference-counted, so the same document can be
registered by multiple providers and will only stop receiving future styles
after every registration has been cleaned up.

```js
import { registerDocument } from '@wordpress/style-runtime';

const cleanup = registerDocument( document );

cleanup();
```

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
