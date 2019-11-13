# Text

A text component.

## Usage

### Component

```jsx
import {Text} from '@wordpress/components';

const HeroPanel = () => (
	<>
		<Text variant="title.large" as="h1">Hello World!</Text>
		<Text variant="body">Greetings to you!.</Text>
	</>
);
```

### Mixin

```jsx
import styled from '@emotion/components';
import {text} from '@wordpress/components';

const Button = styled.button`
	${text({variant: 'button'})}
`;
```
