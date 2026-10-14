import { useState } from '@wordpress/element';
import LineHeightControl from '../';

export default {
	component: LineHeightControl,
	id: 'blockeditor-lineheightcontrol',
	title: 'Editor/Block Editor/LineHeightControl',
};

const Template = ( props ) => {
	const [ value, setValue ] = useState();
	return (
		<LineHeightControl onChange={ setValue } value={ value } { ...props } />
	);
};

export const Default = Template.bind( {} );
Default.args = {
	__unstableInputWidth: '100px',
};

export const UnconstrainedWidth = Template.bind( {} );
UnconstrainedWidth.args = {
	...Default.args,
	__unstableInputWidth: '100%',
};
