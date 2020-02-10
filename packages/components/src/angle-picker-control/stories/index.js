/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import AnglePickerControl from '../';

export default {
	title: 'Components|AnglePickerControl',
	component: AnglePickerControl,
};

const AnglePickerWithState = () => {
	const [ angle, setAngle ] = useState();
	return <AnglePickerControl value={ angle } onChange={ setAngle } />;
};

export const _default = () => {
	return <AnglePickerWithState />;
};
