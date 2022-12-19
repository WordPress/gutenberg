/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import LineHeightControl from '../';

export default {
	component: LineHeightControl,
	title: 'BlockEditor/LineHeightControl',
};

const Template = ( props ) => {
	const [ value, setValue ] = useState();
	return (
		<LineHeightControl onChange={ setValue } value={ value } { ...props } />
	);
};

export const Default = Template.bind( {} );
Default.args = {
	__nextHasNoMarginBottom: true,
	__unstableInputWidth: '60px',
};

export const UnconstrainedWidth = Template.bind( {} );
UnconstrainedWidth.args = {
	...Default.args,
	__unstableInputWidth: '100%',
};
