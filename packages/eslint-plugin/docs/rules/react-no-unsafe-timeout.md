# Disallow unsafe `setTimeout` in component (react-no-unsafe-timeout)

`setTimeout` in a component must be cancelled when the component is unmounted. This rule disallows references to the `setTimeout` global which occur in a component, and which are not assigned to a variable. A variable assignment is considered an acceptable use on the assumption that the timeout ID will be later referenced for cancellation via `clearTimeout`.

Consider using the [`withSafeTimeout` higher-order component](https://github.com/WordPress/gutenberg/tree/master/packages/compose/src/with-safe-timeout) from the [`@wordpress/compose` module](https://www.npmjs.com/package/@wordpress/compose).

## Rule details

Examples of **incorrect** code for this rule:

```js
function MyComponent() {
	setTimeout( fn );
}

class MyComponent extends Component {
	componentDidMount() {
		setTimeout( fn );
	}
}

class MyComponent extends wp.element.Component {
	componentDidMount() {
		setTimeout( fn );
	}
}
```

Examples of **correct** code for this rule:

```js
function getNotComponent() {
	setTimeout( fn );
}

function MyComponent( props ) {
	const { setTimeout } = props;
	setTimeout( fn );
}

function MyComponent( props ) {
	props.setTimeout( fn );
}

class MyNotComponent { 
	doAction() {
		setTimeout( fn );
	}
}

class MyComponent extends wp.element.Component {
	componentDidMount() {
		const { setTimeout } = this.props;
		setTimeout( fn );
	}
}

class MyComponent extends Component {
	componentDidMount() {
		const { setTimeout } = this.props;
		setTimeout( fn );
	}
}

class MyComponent extends Component {
	componentDidMount() {
		this.props.setTimeout( fn );
	}
}

class MyComponent extends Component {
	componentDidMount() {
		this.timeoutId = setTimeout( fn );
	}
}
```
