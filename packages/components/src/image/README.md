# Image

Image is a component that renders an image. On the web, it translates to an [img](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img) element, and on native it uses React Native's [Image](https://facebook.github.io/react-native/docs/image.html) component.

## Usage

```jsx
import { Image } from '@wordpress/components';

const MyImage = () => (
	<Image
		src="https://s.w.org/style/images/about/WordPress-logotype-wmark.png"
		alt="WordPress logo"
	/>
);
```

## Props

### alt

An alternative text description of the image.

- Type: `String`
- Required: Yes

### src

The image URL.

- Type: `String`
- Required: Yes
