import { useMemo, useRef, useInsertionEffect } from '@wordpress/element';
import { useRefEffect } from '@wordpress/compose';
import beforeInputRules from './before-input-rules';
import inputRules from './input-rules';
import insertReplacementText from './insert-replacement-text';
import removeBrowserShortcuts from './remove-browser-shortcuts';
import shortcuts from './shortcuts';
import inputEvents from './input-events';
import pasteHandler, { drop } from './paste-handler';
import { dragStart } from './drag-and-drop';
import _delete from './delete';
import enter from './enter';
import firefoxCompat from './firefox-compat';
import type { RichTextEventListenerProps } from '../types';

const allEventListeners = [
	beforeInputRules,
	inputRules,
	insertReplacementText,
	removeBrowserShortcuts,
	shortcuts,
	inputEvents,
	pasteHandler,
	dragStart,
	_delete,
	enter,
	firefoxCompat,
];

export function useEventListeners( props: RichTextEventListenerProps ) {
	const propsRef = useRef( props );
	useInsertionEffect( () => {
		propsRef.current = props;
	} );
	const refEffects = useMemo(
		() => allEventListeners.map( ( refEffect ) => refEffect( propsRef ) ),
		[ propsRef ]
	);
	// A drop can land on any field, selected or not.
	const dropEffect = useMemo( () => drop( propsRef ), [ propsRef ] );

	return useRefEffect(
		( element: HTMLElement ) => {
			const cleanups = [
				dropEffect,
				...( props.isSelected ? refEffects : [] ),
			].map( ( effect ) => effect( element ) );
			return () => {
				cleanups.forEach( ( cleanup ) => cleanup() );
			};
		},
		[ refEffects, dropEffect, props.isSelected ]
	);
}
