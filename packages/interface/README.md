# (Experimental) Interface

The Interface Package contains the basis the start a modern WordPress screen as "core/edit-post" and "core/edit-site". The package offers a store and a set of components. The store is useful to contain common data required by a screen (e.g., active areas). The information is persisted across screen reloads. The components allow one to implement functionality like a sidebar and allow a screen to be extended by third-party plugins by default.



## Installation

Install the module

```bash
npm install @wordpress/interface --save
```

_This package assumes that your code will run in an **ES2015+** environment. If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods. Learn more about it in [Babel docs](https://babeljs.io/docs/en/next/caveats)._


## API Usage

### Complementary Areas

`ComplementaryArea` and `ComplementaryArea.Slot` form a slot fill pair to render complementary areas. Multiple `ComplementaryArea` components representing different complementary areas may be rendered at the same time, but only one appears on the slot depending on which complementary area is enabled.

It is possible to control which complementary is enabled by using the store:

Bellow are some examples of how to control the active complementary area using the store:
```js
wp.data.select('core/interface').getActiveComplementaryArea( 'core/edit-post'); -> "edit-post/document'

wp.data.dispatch('core/interface').enableComplementaryArea( 'core/edit-post', 'edit-post/block' );

wp.data.select('core/interface').getActiveComplementaryArea( 'core/edit-post'); -> "edit-post/block"

wp.data.dispatch('core/interface').disableComplementaryArea( 'core/edit-post' );

wp.data.select('core/interface').getActiveComplementaryArea( 'core/edit-post'); -> null
```

### Pinned Areas

`PinnedItems` and `PinnedItems.Slot`form a slot fill pair to render pinned items or areas of "favorites". `ComplementaryArea` component makes use of `PinnedItems` and automatically adds a pinned item for the complementary areas marked as favorite.

```js
wp.data.select( 'core/interface' ).isItemPinned( 'core/edit-post', 'edit-post-block-patterns/block-patterns-sidebar' ); -> false

wp.data.dispatch('core/interface').pinItem( 'core/edit-post', 'edit-post-block-patterns/block-patterns-sidebar' ); 

wp.data.select( 'core/interface' ).isItemPinned( 'core/edit-post', 'edit-post-block-patterns/block-patterns-sidebar' ); -> true

wp.data.dispatch('core/interface').unpinItem( 'core/edit-post', 'edit-post-block-patterns/block-patterns-sidebar' );

wp.data.select( 'core/interface' ).isItemPinned( 'core/edit-post', 'edit-post-block-patterns/block-patterns-sidebar' ); -> false
```

