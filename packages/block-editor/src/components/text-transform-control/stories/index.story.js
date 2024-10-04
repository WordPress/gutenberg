/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import TextTransformControl from '../';

export default {
	title: 'BlockEditor/TextTransformControl',
	component: TextTransformControl,
	argTypes: {
		onChange: { action: 'onChange' },
	},
};

const Template = ( { onChange, ...args } ) => {
	const [ value, setValue ] = useState();
	return (
		<TextTransformControl
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
