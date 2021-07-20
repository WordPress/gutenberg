/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { FormGroup } from '../../ui/form-group';
import { Text } from '../../text';
import { VStack } from '../../v-stack';
import { Slider } from '..';

export default {
	component: Slider,
	title: 'Components (Experimental)/Slider',
};

export const _default = () => {
	const [ value, setValue ] = useState( '50px' );

	return (
		<VStack>
			<Text>Value: { value }</Text>
			<FormGroup label="Test slider">
				<Slider onChange={ setValue } value={ value } />
			</FormGroup>
			<FormGroup label="Test slider">
				<Slider onChange={ setValue } value={ value } />
			</FormGroup>
		</VStack>
	);
};
