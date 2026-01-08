/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * External dependencies
 */
import type { StoryObj, Meta } from '@storybook/react-webpack5';

/**
 * Internal dependencies
 */
import { ValidatedNumberControl } from '../number-control';
import { formDecorator } from './story-utils';

const meta: Meta< typeof ValidatedNumberControl > = {
	title: 'Components/Selection & Input/Validated Form Controls/ValidatedNumberControl',
	id: 'components-validatednumbercontrol',
	component: ValidatedNumberControl,
	tags: [ 'status-private' ],
	decorators: formDecorator,
	args: { onChange: () => {} },
	argTypes: {
		prefix: { control: { type: 'text' } },
		step: { control: { type: 'text' } },
		suffix: { control: { type: 'text' } },
		type: { control: { type: 'text' } },
		value: { control: false },
	},
};
export default meta;

export const Default: StoryObj< typeof ValidatedNumberControl > = {
	render: function Template( { onChange, ...args } ) {
		const [ value, setValue ] =
			useState<
				React.ComponentProps< typeof ValidatedNumberControl >[ 'value' ]
			>();

		return (
			<ValidatedNumberControl
				{ ...args }
				value={ value }
				onChange={ ( newValue, extra ) => {
					setValue( newValue );
					onChange?.( newValue, extra );
				} }
				customValidity={
					value && parseInt( value.toString(), 10 ) % 2 !== 0
						? {
								type: 'invalid',
								message: 'Choose an even number.',
						  }
						: undefined
				}
			/>
		);
	},
};
Default.args = {
	required: true,
	label: 'Number',
	help: 'Odd numbers are not allowed.',
};
