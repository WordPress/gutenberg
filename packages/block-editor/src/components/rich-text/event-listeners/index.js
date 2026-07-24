/**
 * WordPress dependencies
 */
import { useMemo, useRef, useInsertionEffect } from '@wordpress/element';
import { useRefEffect } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import beforeInputRules from './before-input-rules';
import inputRules from './input-rules';
import insertReplacementText from './insert-replacement-text';
import removeBrowserShortcuts from './remove-browser-shortcuts';
import shortcuts from './shortcuts';
import inputEvents from './input-events';
import undoAutomaticChange from './undo-automatic-change';
import pasteHandler from './paste-handler';
import _delete from './delete';
import enter from './enter';
import firefoxCompat from './firefox-compat';

const allEventListeners = [
	beforeInputRules,
	inputRules,
	insertReplacementText,
	removeBrowserShortcuts,
	shortcuts,
	inputEvents,
	undoAutomaticChange,
	pasteHandler,
	_delete,
	enter,
	firefoxCompat,
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
			if ( ! props.isSelected ) {
				return;
			}
			const cleanups = refEffects.map( ( effect ) => effect( element ) );
			return () => {
				cleanups.forEach( ( cleanup ) => cleanup() );
			};
		},
		[ refEffects, props.isSelected ]
	);
}
