/**
 * WordPress dependencies
 */
import { useMemo, useRef } from '@wordpress/element';
import { useRefEffect } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import copyHandler from './copy-handler';
import selectObject from './select-object';
import formatBoundaries from './format-boundaries';
import deleteHandler from './delete';
import inputAndSelection from './input-and-selection';
import selectionChangeCompat from './selection-change-compat';

const allEventListeners = [
	copyHandler,
	selectObject,
	formatBoundaries,
	deleteHandler,
	inputAndSelection,
	selectionChangeCompat,
];

export function useEventListeners( props ) {
	const propsRef = useRef( props );
	propsRef.current = props;
	const refEffects = useMemo(
		() => allEventListeners.map( ( refEffect ) => refEffect( propsRef ) ),
		[ propsRef ]
	);

	return useRefEffect(
		( element ) => {
			const cleanups = refEffects.map( ( effect ) => effect( element ) );
			return () => {
				cleanups.forEach( ( cleanup ) => cleanup() );
			};
		},
		[ refEffects ]
	);
}
