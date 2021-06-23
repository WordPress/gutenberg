/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import SearchControl from '../';

export default {
	title: 'Components/SearchControl',
	component: SearchControl,
};

export const _default = () => {
	const [ value, setValue ] = useState();

	return <SearchControl value={ value } onChange={ setValue } />;
};
