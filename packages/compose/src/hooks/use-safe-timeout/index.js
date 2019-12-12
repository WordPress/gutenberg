/**
 * External dependencies
 */
import { without } from 'lodash';

/**
 * WordPress dependencies
 */
import { useRef, useEffect } from '@wordpress/element';

export default function useSafeTimeout() {
	const timeouts = useRef( [] );

	function clearTimeout( id ) {
		clearTimeout( id );
		timeouts.current = without( timeouts.current, id );
	}

	function setTimeout( fn, delay ) {
		const id = setTimeout( () => {
			fn();
			clearTimeout( id );
		}, delay );
		timeouts.current.push( id );
		return id;
	}

	useEffect( () => () => {
		timeouts.current.forEach( clearTimeout );
	}, [] );

	return {
		clearTimeout,
		setTimeout,
	};
}
