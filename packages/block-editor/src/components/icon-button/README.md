IconButton
=============================

Proved the IconButton style button for the mobile editor used in the inserter. 

## Usage


```jsx
function render() {
	return (
		<View>
			<Text>Some rendered content here</Text>
			<IconButton item={ { title: "Short Text", icon: <SVG></SVG> } } onSelect={ function( item ) { console.log( 'selected' ); } } />
		</View>
	);
}
```

_Note:_ 

## Props

### `maxWidth`
* **Type:** `String`
* **Default:** `undefined`

The max-width of the button. 

### `itemWidth`
* **Type:** `String`
* **Default:** `undefined`

The button width. 

### `onSelect`
* **Type:** `Function`
* **Required** `true`

The function that is called once the IconButton has been selected.

### `item`
* **Type:** `Object`
* **Required** `true`

The object that gets selected. 

## Examples

<IconButton
    item={ item }
    itemWidth={ itemWidth }
    maxWidth={ maxWidth }
    onSelect={ onSelect }
/>
