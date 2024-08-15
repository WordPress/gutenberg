# InserterButton

InserterButton is a type of button component.

## Usage

```jsx
function render() {
	return (
		<View>
			<Text>Some rendered content here</Text>
			<InserterButton
				item={ { title: 'Short Text', icon: <SVG></SVG> } }
				onSelect={ function ( item ) {
					console.log( 'selected' );
				} }
			/>
		</View>
	);
}
```

_Note:_

## Props

### `maxWidth`

-   **Type:** `String`
-   **Default:** `undefined`

The max-width of the button.

### `itemWidth`

-   **Type:** `String`
-   **Default:** `undefined`

The button width.

### `onSelect`

-   **Type:** `Function`
-   **Required** `true`

The function that is called once the InserterButton has been selected.

### `item`

-   **Type:** `Object`
-   **Required** `true`

The object that gets selected.

## Examples

<InserterButton
item={ item }
itemWidth={ itemWidth }
maxWidth={ maxWidth }
onSelect={ onSelect }
/>
