# Discourage passing string literals to reference data stores (data-no-store-string-literals)

Ensures that string literals aren't used for accessing `@wordpress/data` stores when using API methods. The store definition is promoted as the preferred way of referencing registered stores.

## Rule details

Examples of **incorrect** code for this rule:

```js
import { select } from '@wordpress/data';

const blockTypes = select( 'core/blocks' ).getBlockTypes();
```

Examples of **correct** code for this rule:

```js
import { store as blocksStore } from '@wordpress/blocks';
import { select } from '@wordpress/data';

const blockTypes = select( blocksStore ).getBlockTypes();
```
