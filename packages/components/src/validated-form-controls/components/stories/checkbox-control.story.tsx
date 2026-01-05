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
import { ValidatedCheckboxControl } from '../checkbox-control';
import { formDecorator } from './story-utils';

const meta: Meta< typeof ValidatedCheckboxControl > = {
	title: 'Components/Selection & Input/Validated Form Controls/ValidatedCheckboxControl',
	id: 'components-validatedcheckboxcontrol',
	component: ValidatedCheckboxControl,
	tags: [ 'status-private' ],
	decorators: formDecorator,
	args: { onChange: () => {} },
	argTypes: {
		checked: { control: false },
		// TODO: Figure out why this deprecated prop is still showing up here and not in the WP Storybook.
		heading: { table: { disable: true } },
	},
};
export default meta;

export const Default: StoryObj< typeof ValidatedCheckboxControl > = {
	render: function Template( { onChange, ...args } ) {
		const [ checked, setChecked ] = useState( false );

		return (
			<ValidatedCheckboxControl
				{ ...args }
				checked={ checked }
				onChange={ ( newValue ) => {
					setChecked( newValue );
					onChange?.( newValue );
				} }
				customValidity={
					checked
						? {
								type: 'invalid',
								message: 'This checkbox may not be checked.',
						  }
						: undefined
				}
			/>
		);
	},
};
Default.args = {
	required: true,
	label: 'Checkbox',
	help: 'This checkbox may neither be checked nor unchecked.',
};
