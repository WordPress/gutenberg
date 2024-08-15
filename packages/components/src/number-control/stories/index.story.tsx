/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import NumberControl from '..';

const meta: Meta< typeof NumberControl > = {
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
		docs: { canvas: { sourceState: 'shown' } },
	},
};

export default meta;

const Template: StoryFn< typeof NumberControl > = ( {
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
