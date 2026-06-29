---
number: 8567
type: issue
state: CLOSED
url: https://github.com/WordPress/gutenberg/issues/8567
matched_labels: ["[Package] Components"]
all_labels: ["[Type] Bug","Framework","[Package] Components"]
---

# Issue #8567: withFilters: Filter is not applied

- URL: https://github.com/WordPress/gutenberg/issues/8567
- Author: mmtr
- Created: 2018-08-05T21:54:17Z
- Updated: 2018-08-13T12:08:47Z
- Comments: 8 of 8

## Body

**Describe the bug**
When rendering a component using the `withFilters` higher order component outside Gutenberg, the filter is not applied.

**To Reproduce**
Execute the code below in a new React project after installing `@wordpress/components` and `@wordpress/hooks`.

```jsx
import { withFilters } from '@wordpress/components';
import { addFilter } from '@wordpress/hooks';

const ComposedComponent = () => <div>Composed component</div>;

addFilter(
	'MyHookName',
	'example/filtered-component',
	( FilteredComponent ) => () => (
		<div>
			<FilteredComponent />
			<ComposedComponent />
		</div>
	)
);

const MyComponentWithFilters = withFilters( 'MyHookName' )( 
	() => <div>My component</div> 
);

ReactDOM.render(
	<MyComponentWithFilters />,
	document.getElementById( 'root' )
);
```

**Expected behavior**
"Composed component" should appear below "My component".

**Screenshots**
![screen shot 2018-08-05 at 23 53 56](https://user-images.githubusercontent.com/1233880/43690466-d7667e42-990a-11e8-9d93-632daadd7315.png)

**Desktop:**
 - OS: macOS High Sierra
 - Browser: Chrome
 - Version: 67

**Additional context**
Issue found while working on #8338 and Automattic/wp-calypso#26367

## Issue comments

### gziolo on 2018-08-06T13:25:03Z

URL: https://github.com/WordPress/gutenberg/issues/8567#issuecomment-410706676

I can't reproduce inside Gutenberg:

![screen shot 2018-08-06 at 15 24 18](https://user-images.githubusercontent.com/699132/43719030-d38dbe2a-998c-11e8-8e40-2685b5247fd5.png)

Can you try again outside of LiveReact context and confirm?

### mmtr on 2018-08-06T22:33:38Z

URL: https://github.com/WordPress/gutenberg/issues/8567#issuecomment-410873954

you're right! `react-live` is causing the issue. I have tested it in a clean project and is working nicely: 
- Demo: https://mmtr.github.io/wordpress-components/#/with-filters
- Code: https://github.com/mmtr/wordpress-components/blob/master/src/examples/with-filters.jsx

I'll try to figure out how to solve the issue with `react-live`. 

sorry for false alarm!

### mmtr on 2018-08-11T10:20:10Z

URL: https://github.com/WordPress/gutenberg/issues/8567#issuecomment-412265978

It looks like the issue is present with `@wordpress/components@2.0.0`:

- Demo: https://mmtr.github.io/wordpress-components/#/with-filters
- Code: https://github.com/mmtr/wordpress-components/blob/master/src/examples/with-filters.jsx

### gziolo on 2018-08-11T10:52:10Z

URL: https://github.com/WordPress/gutenberg/issues/8567#issuecomment-412267572

Don’t you encounter a similar issue as with data package where 2 instances of the same library with different versions are loaded?

### mmtr on 2018-08-11T10:57:41Z

URL: https://github.com/WordPress/gutenberg/issues/8567#issuecomment-412267828

I think you're confusing with someone else. I have not played around yet with the data package.

### gziolo on 2018-08-13T10:39:40Z

URL: https://github.com/WordPress/gutenberg/issues/8567#issuecomment-412477506

It was a question, see a related discussion where two different versions of the same library were loaded causing issues with internal state: https://github.com/Automattic/wp-calypso/pull/26438#issuecomment-411341882

@jsnajdr can you help to debug this one?

### jsnajdr on 2018-08-13T11:58:54Z

URL: https://github.com/WordPress/gutenberg/issues/8567#issuecomment-412494393

Yes, it looks like the `@wordpress/hooks` module is duplicated and because it contains a filter registry, the `addFilter` and `applyFilters` function work with different registries.

On my local `wp-calypso`, I have 5 copies:
```
$ find . -path "*/@wordpress/hooks"
./node_modules/@wordpress/blocks/node_modules/@wordpress/hooks
./node_modules/@wordpress/api-fetch/node_modules/@wordpress/hooks
./node_modules/@wordpress/components/node_modules/@wordpress/hooks
./node_modules/@wordpress/hooks
./node_modules/@wordpress/editor/node_modules/@wordpress/hooks
```

The solution is to regenerate the `npm-shrinkwrap.json` file with `npm run update-deps`. That forces NPM to deduplicate the modules. It's also important that `@wordpress/hooks` is a top level dependency of Calypso, but it already is.

### gziolo on 2018-08-13T12:08:24Z

URL: https://github.com/WordPress/gutenberg/issues/8567#issuecomment-412496555

@jsnajdr, thanks for double checking this one. I'm closing this issue in here, because it isn't an issue with `hooks` itself. We will try to come up with an action item to attack this general issue of consuming multiple `@wordpress/*` packages at once tomorrow during Core JS meeting.
See: https://docs.google.com/document/d/1KNa4xxktVskFV86SVMbdTWx3bINrLikBnJpntBZw1DU/edit.

