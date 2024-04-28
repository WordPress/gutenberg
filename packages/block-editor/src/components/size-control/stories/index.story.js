/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import SizeControl from '../';

export default {
	component: SizeControl,
	title: 'BlockEditor/SizeControl',
};

const Template = ( props ) => {
	const [ value, setValue ] = useState();
	return <SizeControl onChange={ setValue } value={ value } { ...props } />;
};

export const Default = Template.bind( {} );
