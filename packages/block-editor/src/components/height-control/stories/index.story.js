/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import HeightControl from '../';

export default {
	component: HeightControl,
	title: 'Block Editor/HeightControl',
};

const Template = ( props ) => {
	const [ value, setValue ] = useState();
	return <HeightControl onChange={ setValue } value={ value } { ...props } />;
};

export const Default = Template.bind( {} );
