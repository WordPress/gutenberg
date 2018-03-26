Compose if Condition
============

`composeIfCondition` is a higher-order component creator, that enhances the given higher order components (HOCs) if the given condition is satisfied.

## Usage

`composeIfCondition`, passed with a predicate function and an array of HOCs, will enhance the provided component if the given condition condition is satisfied.

```jsx
function MyBoldElement( { text } ) {
	return <strong>{ text }</strong>;
}

const wrapInSpan = WrappedComponent => {
	const EnhancedComponent = ( props ) => {
		return (
			<span>
				<WrappedComponent { ...props } />
			</span>
		);
	}
	return EnhancedComponent;
}

MyEvenNumber = composeIfCondition(
	( props ) => {
		return props.wrappedInSpan === true;
	}, [
		wrapInSpan
	]
)( MyBoldElement );
```
