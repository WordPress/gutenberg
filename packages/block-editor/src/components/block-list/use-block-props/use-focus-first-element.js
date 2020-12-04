/**
 * External dependencies
 */
import { first, last } from 'lodash';

/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { focus, isTextField, placeCaretAtHorizontalEdge } from '@wordpress/dom';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { isInsideRootBlock } from '../../../utils/dom';

/**
 * Transitions focus to the block or inner tabbable when the block becomes
 * selected.
 *
 * @param {Object} ref      React ref with the block element.
 * @param {string} clientId Block client ID.
 */
export function useFocusFirstElement( ref, clientId ) {
	const initialPosition = useSelect(
		( select ) => {
			const {
				getSelectedBlocksInitialCaretPosition,
				isMultiSelecting,
				isNavigationMode,
				isBlockSelected,
			} = select( 'core/block-editor' );

			if ( ! isBlockSelected( clientId ) ) {
				return;
			}

			if ( isMultiSelecting() || isNavigationMode() ) {
				return;
			}

			return getSelectedBlocksInitialCaretPosition() || 1;
		},
		[ clientId ]
	);

	useEffect( () => {
		if ( ! initialPosition ) {
			return;
		}

		const { ownerDocument } = ref.current;

		// Focus is captured by the wrapper node, so while focus transition
		// should only consider tabbables within editable display, since it
		// may be the wrapper itself or a side control which triggered the
		// focus event, don't unnecessary transition to an inner tabbable.
		if (
			ownerDocument.activeElement &&
			isInsideRootBlock( ref.current, ownerDocument.activeElement )
		) {
			return;
		}

		// Find all tabbables within node.
		const textInputs = focus.tabbable.find( ref.current ).filter(
			( node ) =>
				isTextField( node ) &&
				// Exclude inner blocks and block appenders
				isInsideRootBlock( ref.current, node ) &&
				! node.closest( '.block-list-appender' )
		);

		// If reversed (e.g. merge via backspace), use the last in the set of
		// tabbables.
		const isReverse = -1 === initialPosition;
		const target =
			( isReverse ? last : first )( textInputs ) || ref.current;

		placeCaretAtHorizontalEdge( target, isReverse );
	}, [ initialPosition ] );
}
