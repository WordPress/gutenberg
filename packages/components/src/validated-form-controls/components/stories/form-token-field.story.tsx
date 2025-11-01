/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * External dependencies
 */
import type { StoryObj, Meta } from '@storybook/react';

/**
 * Internal dependencies
 */
import { ValidatedFormTokenField } from '../form-token-field';
import { formDecorator } from './story-utils';
import type { TokenItem } from '../../../form-token-field/types';

const meta: Meta< typeof ValidatedFormTokenField > = {
	title: 'Components/Selection & Input/Validated Form Controls/ValidatedFormTokenField',
	id: 'components-validatedformtokenfield',
	component: ValidatedFormTokenField,
	tags: [ 'status-private' ],
	decorators: formDecorator,
	args: { onChange: () => {} },
	argTypes: {
		onChange: { control: false },
		value: { control: false },
		customValidity: { control: false },
	},
};
export default meta;

/**
 * This demonstrates how array validation would work with the ValidatedFormTokenField component.
 */
export const Default: StoryObj< typeof ValidatedFormTokenField > = {
	render: function Template( { onChange, ...args } ) {
		const [ value, setValue ] = useState< ( string | TokenItem )[] >( [] );
		const [ customValidity, setCustomValidity ] =
			useState<
				React.ComponentProps<
					typeof ValidatedFormTokenField
				>[ 'customValidity' ]
			>( undefined );

		return (
			<ValidatedFormTokenField
				{ ...args }
				value={ value }
				onChange={ ( newValue, ...rest ) => {
					setValue( newValue );
					onChange?.( newValue, ...rest );
				} }
				onValidate={ ( v ) => {
					if (
						v?.some( ( token ) => {
							const tokenValue =
								typeof token === 'string' ? token : token.value;
							return tokenValue.toLowerCase() === 'error';
						} )
					) {
						setCustomValidity( {
							type: 'invalid',
							message: 'The tag "error" is not allowed.',
						} );
						return;
					}

					setCustomValidity( undefined );
				} }
				customValidity={ customValidity }
			/>
		);
	},
};

Default.args = {
	required: true,
	label: 'Tags',
	placeholder: 'Add tags...',
	suggestions: [ 'Posts', 'Pages', 'Media', 'Error' ],
	__experimentalExpandOnFocus: true,
};
