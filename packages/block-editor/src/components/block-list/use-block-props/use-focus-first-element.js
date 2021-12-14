/**
 * External dependencies
 */
import { first, last } from 'lodash';

/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';
import { focus, isTextField, placeCaretAtHorizontalEdge } from '@wordpress/dom';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { isInsideRootBlock } from '../../../utils/dom';
import { store as blockEditorStore } from '../../../store';

/** @typedef {import('@wordpress/element').RefObject} RefObject */

/**
 * Returns the initial position if the block needs to be focussed, `undefined`
 * otherwise. The initial position is either 0 (start) or -1 (end).
 *
 * @param {string} clientId Block client ID.
 *
 * @return {number} The initial position, either 0 (start) or -1 (end).
 */
function useInitialPosition( clientId ) {
	return useSelect(
		( select ) => {
			const {
				getSelectedBlocksInitialCaretPosition,
				isMultiSelecting,
				isNavigationMode,
				isBlockSelected,
			} = select( blockEditorStore );

			if ( ! isBlockSelected( clientId ) ) {
				return;
			}

			if ( isMultiSelecting() || isNavigationMode() ) {
				return;
			}

			// If there's no initial position, return 0 to focus the start.
			return getSelectedBlocksInitialCaretPosition();
		},
		[ clientId ]
	);
}

/**
 * Transitions focus to the block or inner tabbable when the block becomes
 * selected and an initial position is set.
 *
 * @param {string} clientId Block client ID.
 *
 * @return {RefObject} React ref with the block element.
 */
export function useFocusFirstElement( clientId ) {
	const ref = useRef();
	const initialPosition = useInitialPosition( clientId );
	const isMounting = useRef( true );

	useEffect( () => {
		if ( initialPosition === undefined || initialPosition === null ) {
			return;
		}

		if ( ! ref.current ) {
			return;
		}

		const { ownerDocument } = ref.current;

		// Do not focus the block if it already contains the active element.
		if ( ref.current.contains( ownerDocument.activeElement ) ) {
			return;
		}

		let target = ref.current;

		// If reversed (e.g. merge via backspace), use the last in the set of
		// tabbables.
		const isReverse = -1 === initialPosition;

		// Find all text fields or placeholders within the block.
		const candidates = focus.tabbable
			.find( target )
			.filter(
				( node ) =>
					isTextField( node ) ||
					( isMounting.current &&
						node.classList.contains(
							'wp-block-editor-placeholder'
						) )
			);

		target = ( isReverse ? last : first )( candidates ) || target;

		if ( ! isInsideRootBlock( ref.current, target ) ) {
			ref.current.focus();
			return;
		}

		placeCaretAtHorizontalEdge( target, isReverse );
	}, [ initialPosition ] );

	useEffect( () => {
		isMounting.current = false;
	}, [] );

	return ref;
}
