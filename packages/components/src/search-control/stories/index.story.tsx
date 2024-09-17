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
import SearchControl from '..';

const meta: Meta< typeof SearchControl > = {
	title: 'Components/SearchControl',
	component: SearchControl,
	argTypes: {
		onChange: { action: 'onChange' },
		value: { control: { type: null } },
	},
	parameters: {
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

const Template: StoryFn< typeof SearchControl > = ( {
	onChange,
	...props
} ) => {
	const [ value, setValue ] = useState< string >();

	return (
		<SearchControl
			{ ...props }
			value={ value }
			onChange={ ( ...changeArgs ) => {
				setValue( ...changeArgs );
				onChange( ...changeArgs );
			} }
		/>
	);
};

export const Default = Template.bind( {} );
Default.args = {
	help: 'Help text to explain the input.',
	__nextHasNoMarginBottom: true,
};

/**
 * When an `onClose` callback is provided, the search control will render a close button
 * that will trigger the given callback.
 *
 * Use this if you want the button to trigger your own logic to close the search field entirely,
 * rather than just clearing the input value.
 */
export const WithOnClose = Template.bind( {} );
WithOnClose.args = {
	...Default.args,
};
WithOnClose.argTypes = {
	onClose: { action: 'onClose' },
};
