/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import NumberControl from '..';

const meta: ComponentMeta< typeof NumberControl > = {
	title: 'Components (Experimental)/NumberControl',
	component: NumberControl,
	argTypes: {
		onChange: { action: 'onChange' },
		prefix: { control: { type: 'text' } },
		step: { control: { type: 'text' } },
		suffix: { control: { type: 'text' } },
		type: { control: { type: 'text' } },
		value: { control: null },
	},
	parameters: {
		controls: { expanded: true },
		docs: { source: { state: 'open' } },
	},
};

export default meta;

const Template: ComponentStory< typeof NumberControl > = ( {
	onChange,
	...props
} ) => {
	const [ value, setValue ] = useState< string | undefined >( '0' );
	const [ isValidValue, setIsValidValue ] = useState( true );

	return (
		<>
			<NumberControl
				{ ...props }
				value={ value }
				onChange={ ( v, extra ) => {
					setValue( v );
					setIsValidValue(
						( extra.event.target as HTMLInputElement ).validity
							.valid
					);
					onChange?.( v, extra );
				} }
			/>
			<p>Is valid? { isValidValue ? 'Yes' : 'No' }</p>
		</>
	);
};

export const Default = Template.bind( {} );
Default.args = {
	label: 'Value',
};

// Check if this was broken and at what point
// in particular on commit actions, when `min` is not `undefined`
export const Uncontrolled: ComponentStory< typeof NumberControl > = ( {
	onChange,
	...props
} ) => {
	const [ isValidValue, setIsValidValue ] = useState( true );

	return (
		<>
			<NumberControl
				{ ...props }
				onChange={ ( v, extra ) => {
					setIsValidValue(
						( extra.event.target as HTMLInputElement ).validity
							.valid
					);
					onChange?.( v, extra );
				} }
			/>
			<p>Is valid? { isValidValue ? 'Yes' : 'No' }</p>
		</>
	);
};
