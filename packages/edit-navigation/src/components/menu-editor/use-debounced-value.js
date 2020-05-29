/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';

const useDebouncedValue = ( value, timeout ) => {
	const [ state, setState ] = useState( value );

	useEffect( () => {
		const handler = setTimeout( () => setState( value ), timeout );

		return () => clearTimeout( handler );
	}, [ value, timeout ] );

	return state;
};

export default useDebouncedValue;
