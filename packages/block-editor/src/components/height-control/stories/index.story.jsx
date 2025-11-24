/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import HeightControl from '../';

export default {
	component: HeightControl,
	title: 'BlockEditor/HeightControl',
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component:
					'HeightControl renders a SliderControl that lets the user enter a height value.',
			},
		},
	},
	argTypes: {
		value: {
			control: { type: null },
			description: 'The current height value.',
			table: {
				type: { summary: 'string' },
			},
		},
		onChange: {
			action: 'onChange',
			control: { type: null },
			description: 'A callback function invoked when the height changes.',
			table: {
				type: { summary: 'function' },
			},
		},
		label: {
			control: 'text',
			description: 'A label for the control.',
			table: {
				type: { summary: 'string' },
			},
		},
	},
};

const Template = ( props ) => {
	const [ value, setValue ] = useState();
	return <HeightControl onChange={ setValue } value={ value } { ...props } />;
};

export const Default = Template.bind( {} );
