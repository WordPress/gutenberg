# (Experimental) Interface

The Interface Package contains the basis the start a modern WordPress screen as "core/edit-post" and "core/edit-site". The package offers a store and a set of components. The store is useful to contain common data required by a screen (e.g., active areas). The information is persisted across screen reloads. The components allow one to implement functionality like a sidebar and allow a screen to be extended by third-party plugins by default.



## Installation

Install the module

```bash
npm install @wordpress/interface --save
```

_This package assumes that your code will run in an **ES2015+** environment. If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods. Learn more about it in [Babel docs](https://babeljs.io/docs/en/next/caveats)._


### API Usage



#### Store

#### Single Active Area Functionality

This functionality allows controlling which area is active in situations where just one area can be active at a given time.
It can be used, for example, to control which modal is active or which sidebar is enabled.

The API exposes a single action `setSingleActiveArea`, and a single selector `getSingleActiveArea`.

The action `setSingleActiveArea` receives a scope and the area that should be active in a given scope or `undefined` if no area should be active (e.g., the area is closed.)

The selector `getSingleActiveArea` receives the scope and returns the area that is active in that scope or `undefined` if no area is active.

Bellow are some examples of the action and selector used together:
```js
wp.data.dispatch( 'core/interface' ).setSingleActiveArea( 'edit-site/complementary-area', 'edit-site/block-inspector'  );

wp.data.select( 'core/interface' ).getSingleActiveArea( 'edit-site/complementary-area' ); -> "edit-site/block-inspector"

wp.data.dispatch( 'core/interface' ).setSingleActiveArea( 'edit-site/complementary-area', 'edit-site/global-styles'  );

wp.data.select( 'core/interface' ).getSingleActiveArea( 'edit-site/complementary-area' ); -> "edit-site/global-styles"

wp.data.dispatch( 'core/interface' ).setSingleActiveArea( 'edit-site/complementary-area' );

wp.data.select( 'core/interface' ).getSingleActiveArea( 'edit-site/complementary-area' ); -> undefined
```

#### Multiple Active Area Functionality

This functionality allows controlling which areas are active in situations where multiple areas can be active at the same time.
It can be used, for example, to control which panels are open are which items should appear in an area for favorites.

Similar to the single active area the API exposes a single action `setMultipleActiveAreaEnableState`, and a single selector `isMultipleActiveAreaActive`.

The action `setMultipleActiveAreaEnableState` receives a scope, the identifier of the area, and a boolean if true the are should be active if false the area should not be active.

The selector `isMultipleActiveAreaActive` receives the scope, the identifier of the area, and returns true if an area is active and false otherwise.
Bellow are some examples of the action and selector used together:
```js
wp.data.select( 'core/interface' ).isMultipleActiveAreaActive( 'edit-post/complementary-area', 'edit-post/block-patterns-sidebar' ); -> false

wp.data.dispatch( 'core/interface' ).setMultipleActiveAreaEnableState( 'edit-post/complementary-area', 'edit-post/block-patterns-sidebar', true );

wp.data.select( 'core/interface' ).isMultipleActiveAreaActive( 'edit-post/complementary-area', 'edit-post/block-patterns-sidebar' ); -> true
```


### Components

Four components are exposed. The components are based on slot & fill paradigm two components are "fills" and two components are "slots".

`ComplementaryArea` and `ComplementaryArea.Slot` form a slot fill pair to render complementary areas. Multiple `ComplementaryArea` components representing different complementary areas may be rendered at the same time, but only one appears on the slot depending on which complementary area is enabled.

`PinnedItems` and `PinnedItems.Slot`form a slot fill pair to render pinned items or areas of "favorites". `ComplementaryArea` component makes use of `PinnedItems` and automatically adds a pinned item for the complementary areas marked as favorite.

