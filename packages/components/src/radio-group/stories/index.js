/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Radio from '../../radio';
import RadioGroup from '../';

export default { title: 'Components/RadioGroup', component: RadioGroup };

export const _default = () => {
	/* eslint-disable no-restricted-syntax */
	// id is required for server side rendering
	return (
		<RadioGroup
			id="default-radiogroup"
			accessibilityLabel="options"
			defaultChecked="option2"
		>
			<Radio id="option1-radio" value="option1">
				Option 1
			</Radio>
			<Radio id="option2-radio" value="option2">
				Option 2
			</Radio>
			<Radio id="option3-radio" value="option3">
				Option 3
			</Radio>
		</RadioGroup>
	);
	/* eslint-enable no-restricted-syntax */
};

const ControlledRadioGroupWithState = () => {
	const [ checked, setChecked ] = useState( 'option2' );

	/* eslint-disable no-restricted-syntax */
	// id is required for server side rendering
	return (
		<RadioGroup
			id="controlled-radiogroup"
			accessibilityLabel="options"
			checked={ checked }
			onChange={ setChecked }
		>
			<Radio id="option1-radio" value="option1">
				Option 1
			</Radio>
			<Radio id="option2-radio" value="option2">
				Option 2
			</Radio>
			<Radio id="option3-radio" value="option3">
				Option 3
			</Radio>
		</RadioGroup>
	);
	/* eslint-enable no-restricted-syntax */
};

export const controlled = () => {
	return <ControlledRadioGroupWithState />;
};
