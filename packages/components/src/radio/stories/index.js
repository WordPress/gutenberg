/**
 * Internal dependencies
 */
import RadioGroup from '../../radio-group';
import Radio from '../';

export default { title: 'Components (Experimental)/Radio', component: Radio };

export const _default = () => {
	// Radio components must be a descendent of a RadioGroup component.
	/* eslint-disable no-restricted-syntax */
	return (
		// id is required for server side rendering
		<RadioGroup id="default-radiogroup" label="options">
			<Radio value="option1">Option 1</Radio>
			<Radio value="option2">Option 2</Radio>
		</RadioGroup>
	);
	/* eslint-enable no-restricted-syntax */
};
