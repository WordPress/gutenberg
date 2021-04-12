/**
 * WordPress dependencies
 */
import { useState, useEffect, useCallback } from '@wordpress/element';

export default function useInserter( inserter ) {
	const [ isInserterOpened, setIsInserterOpened ] = useState(
		() => inserter.isOpen
	);

	useEffect( () => {
		return inserter.subscribe( setIsInserterOpened );
	}, [ inserter ] );

	return [
		isInserterOpened,
		useCallback(
			( updater ) => {
				let isOpen = updater;
				if ( typeof updater === 'function' ) {
					isOpen = updater( inserter.isOpen );
				}

				if ( isOpen ) {
					inserter.open();
				} else {
					inserter.close();
				}
			},
			[ inserter ]
		),
	];
}
