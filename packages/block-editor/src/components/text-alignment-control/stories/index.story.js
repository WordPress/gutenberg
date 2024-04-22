/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../../lock-unlock';

const { TextAlignmentControl } = unlock( blockEditorPrivateApis );

export default {
	title: 'BlockEditor/TextAlignmentControl',
	component: TextAlignmentControl,
	argTypes: {
		onChange: { action: 'onChange' },
		className: { control: 'text' },
		controls: {
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
