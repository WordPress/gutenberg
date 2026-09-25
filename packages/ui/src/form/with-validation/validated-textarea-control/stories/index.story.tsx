import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from '@wordpress/element';
import { ValidatedTextareaControl } from '../index';
import { formDecorator } from '../../../stories/shared';

const meta: Meta< typeof ValidatedTextareaControl > = {
	tags: [ 'manifest' ],
	title: 'Components/@wordpress-ui/Form/With Validation/ValidatedTextareaControl',
	id: 'design-system-components-form-with-validation-validatedtextareacontrol',
	component: ValidatedTextareaControl,
	argTypes: {
		customValidity: { control: false },
		defaultValue: { control: false },
		onValueChange: { action: 'onValueChange' },
		value: { control: false },
	},
	decorators: [ formDecorator ],
	parameters: {
		componentStatus: {
			status: 'recommended',
			whereUsed: 'global',
		},
	},
};
export default meta;

type Story = StoryObj< typeof ValidatedTextareaControl >;

/**
 * Native constraint validation (here, `required`) is reported inline when the
 * control is blurred or the form is submitted.
 */
export const Default: Story = {
	args: {
		label: 'Text',
		required: true,
	},
};

/**
 * Consumer-driven validation results are passed through the `customValidity`
 * prop. Type the word "error" and blur the field to trigger the custom error.
 */
export const WithCustomValidity: Story = {
	render: function Template( args ) {
		const [ value, setValue ] = useState( '' );

		return (
			<ValidatedTextareaControl
				{ ...args }
				value={ value }
				onValueChange={ ( next ) => setValue( next ?? '' ) }
				customValidity={
					value.toLowerCase() === 'error'
						? {
								type: 'invalid',
								message: 'The word "error" is not allowed.',
							}
						: undefined
				}
			/>
		);
	},
	args: {
		label: 'Text',
		description: "The word 'error' will trigger an error.",
	},
};
