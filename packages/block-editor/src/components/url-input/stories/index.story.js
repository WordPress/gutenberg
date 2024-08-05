/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import URLInput from '..';

export default {
	component: URLInput,
	title: 'BlockEditor/URLInput',
};

export const Default = {
	render: function Template( props ) {
		const [ value, setValue ] = useState();
		return <URLInput onChange={ setValue } value={ value } { ...props } />;
	},
	args: {},
};
