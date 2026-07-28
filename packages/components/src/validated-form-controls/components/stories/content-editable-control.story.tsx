/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * External dependencies
 */
import type { StoryObj, Meta } from '@storybook/react-vite';
/**
 * Internal dependencies
 */
import { formDecorator } from './story-utils';
import { ValidatedContentEditableControl } from '../content-editable-control';

const meta: Meta< typeof ValidatedContentEditableControl > = {
	title: 'Components/Selection & Input/Validated Form Controls/ValidatedContentEditableControl',
	id: 'components-validatedcontenteditablecontrol',
	component: ValidatedContentEditableControl,
	tags: [ 'status-private' ],
	decorators: formDecorator,
	argTypes: { value: { control: false } },
};
export default meta;

export const Default: StoryObj< typeof ValidatedContentEditableControl > = {
	render: function Template( args ) {
		// The control is presentational: the editable manages its own
		// contents, and the consumer mirrors the plain text into `value`
		// for the validity delegate.
		const [ value, setValue ] = useState( '' );

		return (
			<ValidatedContentEditableControl
				{ ...args }
				value={ value }
				onInput={ ( e ) =>
					setValue( e.currentTarget.textContent ?? '' )
				}
				customValidity={
					value.toLowerCase().includes( 'error' )
						? {
								type: 'invalid',
								message: 'The word "error" is not allowed.',
						  }
						: undefined
				}
			/>
		);
	},
};
Default.args = {
	required: true,
	label: 'Content',
	help: 'The word "error" will trigger an error.',
};
