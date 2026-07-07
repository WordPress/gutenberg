/**
 * WordPress dependencies
 */
import { useMemo, useRef, useInsertionEffect } from '@wordpress/element';
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
import { preventFocusCapture } from './prevent-focus-capture';
import shortcuts from './shortcuts';
import inputEvents from './input-events';

const allEventListeners = [
	copyHandler,
	selectObject,
	formatBoundaries,
	deleteHandler,
	inputAndSelection,
	selectionChangeCompat,
	preventFocusCapture,
	shortcuts,
	inputEvents,
];

export function useEventListeners( props ) {
	const propsRef = useRef( props );
	useInsertionEffect( () => {
		propsRef.current = props;
	} );
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
