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

### `itemWidth`
* **Type:** `String`
* **Default:** `undefined`

### `onSelect`
* **Type:** `Function`
* **Required** `true`
* **Default:** `""`

### `item`
* **Type:** `Object`
* **Required** `true`
* **Default:** `""`

## Examples

<IconButton
    item={ item }
    itemWidth={ itemWidth }
    maxWidth={ maxWidth }
    onSelect={ onSelect }
/>
