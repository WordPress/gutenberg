import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef, useState } from '@wordpress/element';
import { ControlWithError } from '../index';
import { InputControl } from '../../../input-control';
import { formDecorator } from '../../../stories/shared';

const meta: Meta< typeof ControlWithError > = {
	title: 'Design System/Components/Form/Primitives/ControlWithError',
	component: ControlWithError,
	argTypes: {
		children: { control: false },
		getValidityTarget: { control: false },
		customValidity: { control: false },
	},
	decorators: [ formDecorator ],
	parameters: {
		componentStatus: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'APIs and behavior are still prone to change.',
		},
	},
};
export default meta;

type Story = StoryObj< typeof ControlWithError >;

/**
 * Native constraint validation (here, `required`) is reported inline when the
 * control is blurred or the form is submitted.
 */
export const Default: Story = {
	args: {
		required: true,
	},
	render: function Template( args ) {
		const inputRef = useRef< HTMLInputElement >( null );
		const [ value, setValue ] = useState( '' );

		return (
			<ControlWithError
				{ ...args }
				getValidityTarget={ () => inputRef.current }
			>
				<InputControl
					ref={ inputRef }
					label="Text"
					value={ value }
					onValueChange={ ( next ) => setValue( next ?? '' ) }
				/>
			</ControlWithError>
		);
	},
};

/**
 * Consumer-driven validation results are passed through the `customValidity`
 * prop. Type the word "error" and blur the field to trigger the custom error.
 */
export const WithCustomValidity: Story = {
	render: function Template( args ) {
		const inputRef = useRef< HTMLInputElement >( null );
		const [ value, setValue ] = useState( '' );

		return (
			<ControlWithError
				{ ...args }
				customValidity={
					value.toLowerCase() === 'error'
						? {
								type: 'invalid',
								message: 'The word "error" is not allowed.',
						  }
						: undefined
				}
				getValidityTarget={ () => inputRef.current }
			>
				<InputControl
					ref={ inputRef }
					label="Text"
					description="The word 'error' will trigger an error."
					value={ value }
					onValueChange={ ( next ) => setValue( next ?? '' ) }
				/>
			</ControlWithError>
		);
	},
};
