# Compose

The `compose` package is a collection of handy [Higher Order Components](https://facebook.github.io/react/docs/higher-order-components.html) (HOCs) you can use to wrap your WordPress components and provide some basic features like: state, instance id, pure...

The `compose` function is an alias to [flowRight](https://lodash.com/docs/#flowRight) from Lodash. It comes from functional programming, and allows you to compose any number of functions. You might also think of this as layering functions; `compose` will execute the last function first, then sequentially move back through the previous functions passing the result of each function upward.

An example that illustrates it for two functions:

```js
const compose = ( f, g ) => x
    => f( g( x ) );
```

Here's a simplified example of **compose** in use from Gutenberg's [`PluginSidebar` component](https://github.com/WordPress/gutenberg/blob/master/packages/edit-post/src/components/sidebar/plugin-sidebar/index.js):

Using compose:

```js
const applyWithSelect = withSelect( ( select, ownProps ) => {
	return doSomething( select, ownProps);
} );
const applyWithDispatch = withDispatch( ( dispatch, ownProps ) => {
	return doSomethingElse( dispatch, ownProps );
} );

export default compose(
	withPluginContext,
	applyWithSelect,
	applyWithDispatch,
)( PluginSidebarMoreMenuItem );
```

Without `compose`, the code would look like this:

```js
const applyWithSelect = withSelect( ( select, ownProps ) => {
	return doSomething( select, ownProps);
} );
const applyWithDispatch = withDispatch( ( dispatch, ownProps ) => {
	return doSomethingElse( dispatch, ownProps );
} );

export default withPluginContext(
	applyWithSelect(
		applyWithDispatch(
			PluginSidebarMoreMenuItem
		)
	)
);


## Installation

Install the module

```bash
npm install @wordpress/compose --save
```

_This package assumes that your code will run in an **ES2015+** environment. If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods. Learn more about it in [Babel docs](https://babeljs.io/docs/en/next/caveats)._

## Usage

An example using the HOC `withInstanceId` from the compose package:

```js
import { withInstanceId } from '@wordpress/compose';

function WrappedComponent( props ) {
	return props.instanceId;
}

const ComponentWithInstanceIdProp = withInstanceId( WrappedComponent );
```

For more details, you can refer to each Higher Order Component's README file. [Available components are located here.](https://github.com/WordPress/gutenberg/tree/master/packages/compose/src)

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
