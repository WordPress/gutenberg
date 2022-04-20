#  UnitRangeControl

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>
<br />
This component combines a `UnitControl` and `RangeControl`

## Development guidelines

TBA

## Usage

```jsx
import { __experimentalUnitRangeControl as UnitRangeControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const GapControl = () => {
	const [ gap, setGap ] = useState();

	return (
		<UnitRangeControl
			label={ __( 'Gap' ) }
			onChange={ setGap }
			value={ gap }
		/>
	);
};
```

## Props

TBA