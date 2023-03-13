/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BoxControl from '../';

export default {
	title: 'Components (Experimental)/BoxControl',
	component: BoxControl,
};

export const _default = () => {
	return <BoxControl />;
};

const defaultSideValues = {
	top: '10px',
	right: '10px',
	bottom: '10px',
	left: '10px',
};

function DemoExample( {
	sides,
	defaultValues = defaultSideValues,
	splitOnAxis = false,
} ) {
	const [ values, setValues ] = useState( defaultValues );

	return (
		<BoxControl
			label="Padding"
			values={ values }
			sides={ sides }
			onChange={ setValues }
			splitOnAxis={ splitOnAxis }
		/>
	);
}

export const arbitrarySides = () => {
	return (
		<DemoExample
			sides={ [ 'top', 'bottom' ] }
			defaultValues={ { top: '10px', bottom: '10px' } }
		/>
	);
};

export const singleSide = () => {
	return (
		<DemoExample
			sides={ [ 'bottom' ] }
			defaultValues={ { bottom: '10px' } }
		/>
	);
};

export const axialControls = () => {
	return <DemoExample splitOnAxis={ true } />;
};

export const axialControlsWithSingleSide = () => {
	return (
		<DemoExample
			sides={ [ 'horizontal' ] }
			defaultValues={ { left: '10px', right: '10px' } }
			splitOnAxis={ true }
		/>
	);
};
