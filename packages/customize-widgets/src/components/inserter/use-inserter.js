/**
 * WordPress dependencies
 */
import { useEffect, useCallback } from '@wordpress/element';
import { useSelect, useDispatch, select as selectStore } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as customizeWidgetsStore } from '../../store';

export default function useInserter( inserter ) {
	const isInserterOpened = useSelect(
		( select ) => select( customizeWidgetsStore ).isInserterOpened(),
		[]
	);
	const { setIsInserterOpened } = useDispatch( customizeWidgetsStore );

	useEffect( () => {
		if ( isInserterOpened ) {
			inserter.open();
		} else {
			inserter.close();
		}
	}, [ inserter, isInserterOpened ] );

	return [
		isInserterOpened,
		useCallback(
			( updater ) => {
				let isOpen = updater;
				if ( typeof updater === 'function' ) {
					isOpen = updater(
						selectStore( customizeWidgetsStore ).isInserterOpened()
					);
				}

				setIsInserterOpened( isOpen );
			},
			[ setIsInserterOpened ]
		),
	];
}
