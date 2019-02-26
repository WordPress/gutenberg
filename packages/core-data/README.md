# Core Data

Core Data is a [data module](/packages/data/README.md) intended to simplify access to and manipulation of core WordPress entities. It registers its own store and provides a number of selectors which resolve data from the WordPress REST API automatically, along with dispatching action creators to manipulate data.

Used in combination with features of the data module such as [`subscribe`](/packages/data/README.md#subscribe-function) or [higher-order components](/packages/data/README.md#higher-order-components), it enables a developer to easily add data into the logic and display of their plugin.

## Installation

Install the module

```bash
npm install @wordpress/core-data --save
```

_This package assumes that your code will run in an **ES2015+** environment. If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods. Learn more about it in [Babel docs](https://babeljs.io/docs/en/next/caveats)._

## Example

Below is an example of a component which simply renders a list of authors:

```jsx
const { withSelect } = wp.data;

function MyAuthorsListBase( { authors } ) {
	return (
		<ul>
			{ authors.map( ( author ) => (
				<li key={ author.id }>{ author.name }</li>
			) ) }
		</ul>
	);
}

const MyAuthorsList = withSelect( ( select ) => ( {
	authors: select( 'core' ).getAuthors(),
} ) )( MyAuthorsListBase );
```

## Actions

The following set of dispatching action creators are available on the object returned by `wp.data.dispatch( 'core' )`:

_Refer to `actions.js` for the full set of dispatching action creators. In the future, this documentation will be automatically generated to detail all available dispatching action creators._

## Selectors

The following selectors are available on the object returned by `wp.data.select( 'core' )`:

_Refer to `selectors.js` for the full set of selectors. In the future, this documentation will be automatically generated to detail all available selectors._

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
