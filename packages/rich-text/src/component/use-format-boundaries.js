/**
 * WordPress dependencies
 */
import { useRef, useReducer } from '@wordpress/element';
import { useRefEffect } from '@wordpress/compose';
import { LEFT, RIGHT } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { isCollapsed } from '../is-collapsed';

const EMPTY_ACTIVE_FORMATS = [];

export function useFormatBoundaries( props ) {
	const [ , forceRender ] = useReducer( () => ( {} ) );
	const propsRef = useRef( props );
	propsRef.current = props;
	return useRefEffect( ( element ) => {
		function onKeyDown( event ) {
			const { keyCode, shiftKey, altKey, metaKey, ctrlKey } = event;

			if (
				// Only override left and right keys without modifiers pressed.
				shiftKey ||
				altKey ||
				metaKey ||
				ctrlKey ||
				( keyCode !== LEFT && keyCode !== RIGHT )
			) {
				return;
			}

			const { record, applyRecord } = propsRef.current;
			const {
				text,
				formats,
				start,
				end,
				activeFormats: currentActiveFormats = [],
			} = record.current;
			const collapsed = isCollapsed( record.current );
			const { ownerDocument } = element;
			const { defaultView } = ownerDocument;
			// To do: ideally, we should look at visual position instead.
			const { direction } = defaultView.getComputedStyle( element );
			const reverseKey = direction === 'rtl' ? RIGHT : LEFT;
			const isReverse = event.keyCode === reverseKey;

			// If the selection is collapsed and at the very start, do nothing if
			// navigating backward.
			// If the selection is collapsed and at the very end, do nothing if
			// navigating forward.
			if ( collapsed && currentActiveFormats.length === 0 ) {
				if ( start === 0 && isReverse ) {
					return;
				}

				if ( end === text.length && ! isReverse ) {
					return;
				}
			}

			// If the selection is not collapsed, let the browser handle collapsing
			// the selection for now. Later we could expand this logic to set
			// boundary positions if needed.
			if ( ! collapsed ) {
				return;
			}

			const formatsBefore = formats[ start - 1 ] || EMPTY_ACTIVE_FORMATS;
			const formatsAfter = formats[ start ] || EMPTY_ACTIVE_FORMATS;

			let newActiveFormatsLength = currentActiveFormats.length;
			let source = formatsAfter;

			if ( formatsBefore.length > formatsAfter.length ) {
				source = formatsBefore;
			}

			// If the amount of formats before the caret and after the caret is
			// different, the caret is at a format boundary.
			if ( formatsBefore.length < formatsAfter.length ) {
				if (
					! isReverse &&
					currentActiveFormats.length < formatsAfter.length
				) {
					newActiveFormatsLength++;
				}

				if (
					isReverse &&
					currentActiveFormats.length > formatsBefore.length
				) {
					newActiveFormatsLength--;
				}
			} else if ( formatsBefore.length > formatsAfter.length ) {
				if (
					! isReverse &&
					currentActiveFormats.length > formatsAfter.length
				) {
					newActiveFormatsLength--;
				}

				if (
					isReverse &&
					currentActiveFormats.length < formatsBefore.length
				) {
					newActiveFormatsLength++;
				}
			}

			if ( newActiveFormatsLength === currentActiveFormats.length ) {
				record.current._newActiveFormats = isReverse
					? formatsBefore
					: formatsAfter;
				return;
			}

			event.preventDefault();

			const newActiveFormats = source.slice( 0, newActiveFormatsLength );
			const newValue = {
				...record.current,
				activeFormats: newActiveFormats,
			};
			record.current = newValue;
			applyRecord( newValue );
			forceRender();
		}

		element.addEventListener( 'keydown', onKeyDown );
		return () => {
			element.removeEventListener( 'keydown', onKeyDown );
		};
	}, [] );
}
