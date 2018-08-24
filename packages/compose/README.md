# Compose

The `compose` package is a collection of handy [Higher Order Components](https://facebook.github.io/react/docs/higher-order-components.html) (HOCs) you can use to wrap your WordPress components and provide some basic features like: state, instance id, pure...

## Installation

Install the module

```bash
npm install @wordpress/compose --save
```

_This package assumes that your code will run in an ES5 environment. If you're using an environment that has limited or no support for ES5 such as lower versions of IE then using [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods. Learn more about it in [Babel docs](https://babeljs.io/docs/en/next/caveats)._

## Usage

```js
import { withInstanceId } from '@wordpress/compose';

function WrappedComponent( props ) {
	return props.instanceId;
}

const ComponentWithInstanceIdProp = withInstanceId( WrappedComponent );
```

Refer to each Higher Order Component's README file for more details.

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
