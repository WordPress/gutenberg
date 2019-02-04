# Animate

TBD...

## Usage

```jsx
import { Notice } from '@wordpress/components';

const MyAnimatedNotice = () => (
	<Animate todo="Add missing props">
		{ ( { className } ) => (
			<Notice className={ className } status="success">
                <p>Animation finished.</p>
			</Notice>
		) }
	</Animate>
);
```

