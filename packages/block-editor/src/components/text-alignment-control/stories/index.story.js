/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import TextAlignmentControl from '../';

export default {
	title: 'BlockEditor/TextAlignmentControl',
	component: TextAlignmentControl,
	argTypes: {
		onChange: { action: 'onChange' },
		className: { control: 'text' },
		options: {
			control: 'check',
			options: [ 'left', 'center', 'right', 'justify' ],
		},
		value: { control: { type: null } },
	},
};

const Template = ( { onChange, ...args } ) => {
	const [ value, setValue ] = useState();
	return (
		<TextAlignmentControl
			{ ...args }
			onChange={ ( ...changeArgs ) => {
				onChange( ...changeArgs );
				setValue( ...changeArgs );
			} }
			value={ value }
		/>
	);
};

export const Default = Template.bind( {} );
