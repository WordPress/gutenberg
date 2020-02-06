/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import AnglePicker from '../';

export default { title: 'Components|AnglePicker', component: AnglePicker };

const AnglePickerWithState = () => {
	const [ angle, setAngle ] = useState();
	return <AnglePicker value={ angle } onChange={ setAngle } />;
};

export const _default = () => {
	return <AnglePickerWithState />;
};
