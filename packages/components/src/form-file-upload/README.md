# FormFileUpload

## Usage

```jsx
import { FormFileUpload } from '@wordpress/components';

function MyFormFileUpload() {
	return (
		<FormFileUpload
			accept="image/*"
			onChange={ () => console.log('new image') }
		>
			Upload
		</FormFileUpload>
	);
}
```
