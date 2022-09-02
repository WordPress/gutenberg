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
import SearchControl from '..';

const meta: ComponentMeta< typeof SearchControl > = {
	title: 'Components/SearchControl',
	component: SearchControl,
	argTypes: {
		onChange: { action: 'onChange' },
		onClose: { action: 'onClose' },
	},
	parameters: {
		controls: { expanded: true },
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const Template: ComponentStory< typeof SearchControl > = ( {
	onChange,
	onClose,
	...props
} ) => {
	const [ value, setValue ] = useState< string >();

	return (
		<SearchControl
			{ ...props }
			value={ value }
			onClose={ onClose }
			onChange={ ( ...changeArgs ) => {
				setValue( ...changeArgs );
				onChange( ...changeArgs );
			} }
		/>
	);
};

export const Default = Template.bind( {} );
Default.args = {
	label: 'Label Text',
	help: 'Help text to explain the input.',
};

/**
 * When an `onClose` callback is provided, the search control will render a close button
 * that will trigger the given callback.
 */
export const WithOnClose = Template.bind( {} );
WithOnClose.args = {
	...Default.args,
	onClose: () => {
		// eslint-disable-next-line no-alert
		alert( 'The search was closed!' );
	},
};
