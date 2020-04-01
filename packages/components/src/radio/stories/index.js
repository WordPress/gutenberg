/**
 * Internal dependencies
 */
import RadioGroup from '../../radio-group';
import Radio from '../';

export default { title: 'Components/Radio', component: Radio };

// Radio components can be in their own component, but must be a descendent of
// a RadioGroup component at some point.
const RadioOptions = () => {
	/* eslint-disable no-restricted-syntax */
	// id is required for server side rendering
	return (
		<>
			<Radio id="option1-radio" value="option1">
				Option 1
			</Radio>
			<Radio id="option2-radio" value="option2">
				Option 2
			</Radio>
		</>
	);
	/* eslint-enable no-restricted-syntax */
};

export const _default = () => {
	/* eslint-disable no-restricted-syntax */
	// id is required for server side rendering
	return (
		<RadioGroup id="default-radiogroup" accessibilityLabel="options">
			<RadioOptions />
		</RadioGroup>
	);
	/* eslint-enable no-restricted-syntax */
};
