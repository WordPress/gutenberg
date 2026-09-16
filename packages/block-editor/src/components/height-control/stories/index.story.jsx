import { useState } from '@wordpress/element';
import HeightControl from '../';

export default {
	component: HeightControl,
	title: 'BlockEditor/HeightControl',
};

const Template = ( props ) => {
	const [ value, setValue ] = useState();
	return <HeightControl onChange={ setValue } value={ value } { ...props } />;
};

export const Default = Template.bind( {} );
