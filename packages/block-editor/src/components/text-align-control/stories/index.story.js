/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import TextAlignControl from '../';

export default {
	title: 'BlockEditor/TextAlignControl',
	component: TextAlignControl,
	argTypes: {
		onChange: { action: 'onChange' },
		className: { control: 'text' },
		controls: { control: 'check', options: [ 'left', 'center', 'right' ] },
		value: { control: { type: null } },
	},
};

const Template = ( { onChange, ...args } ) => {
	const [ value, setValue ] = useState();
	return (
		<TextAlignControl
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
