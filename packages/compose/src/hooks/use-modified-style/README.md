# `useModifiedStyle`

`useModifiedStyle` is a hook that maps a dependency array to a modified style rules . The style selectors
should follow the BEM naming convention. The styles are only recaculated when the the mapped dependencies change.

## Parameters

### `style`

-   Type: `object`

A static style object.

### `modifierStates`

-   Type: `object`

An object of modifier dependencies. The keys are the modifier portion of the BEM selector, and the
values are an array of dependencies to used to enable the modifier. The modifier is enabled if every mapped dependency is truthy.

## Return Object

The hook returns an object where the keys are the `block__element` portion of the BEM selector and the values are the merged style properties.

## Usage

`./styles.scss`

```css
.my-component__container {
	color: grey;
}
.my-component__container--active {
	color: red;
}

.my-component__button {
	font-family: comic-sans;
}
.my-component__button--active {
	font-weight: bold;
}
```

```jsx
import { useModifiedStyle } from '@wordpress/compose';
import { baseStyles } from './styles';

const myComponent = ({isActive}) => {
  const styles = useModifiedStyle( baseStyles, { 'active': [ isActive ] });

  const {
		'my-component__container': containerStyle
    'my-component__button': buttonStyle
  } = styles;

  return (
    <div style={containerStyle} >
      <buttton style={buttonStyle} />
    </div>
  )

}
```
