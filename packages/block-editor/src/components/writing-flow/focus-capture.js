/**
 * External dependencies
 */
import { first, last } from 'lodash';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';
import { focus } from '@wordpress/dom';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { getBlockDOMNode } from '../../utils/dom';

/**
 * Renders focus capturing areas to redirect focus to the selected block if not
 * in Navigation mode.
 *
 * @param {string}  selectedClientId Client ID of the selected block.
 * @param {boolean} isReverse        Set to true if the component is rendered
 *                                   after the block list, false if rendered
 *                                   before.
 * @param {Object}  containerRef     Reference containing the element reference
 *                                   of the block list container.
 * @param {boolean} noCapture        Reference containing the flag for enabling
 *                                   or disabling capturing.
 *
 * @return {WPElement} The focus capture element.
 */
const FocusCapture = forwardRef(
	(
		{
			selectedClientId,
			isReverse,
			containerRef,
			noCapture,
			hasMultiSelection,
			multiSelectionContainer,
		},
		ref
	) => {
		const isNavigationMode = useSelect( ( select ) =>
			select( 'core/block-editor' ).isNavigationMode()
		);
		const { setNavigationMode } = useDispatch( 'core/block-editor' );

		function onFocus() {
			// Do not capture incoming focus if set by us in WritingFlow.
			if ( noCapture.current ) {
				noCapture.current = null;
				return;
			}

			// When focus coming in from out of the block list, and no block is
			// selected, enable Navigation mode and select the first or last block
			// depending on the direction.
			if ( ! selectedClientId ) {
				if ( hasMultiSelection ) {
					multiSelectionContainer.current.focus();
					return;
				}

				setNavigationMode( true );

				const tabbables = focus.tabbable.find( containerRef.current );

				if ( tabbables.length ) {
					if ( isReverse ) {
						last( tabbables ).focus();
					} else {
						first( tabbables ).focus();
					}
				}

				return;
			}

			// If there is a selected block, move focus to the first or last
			// tabbable element depending on the direction.
			const wrapper = getBlockDOMNode( selectedClientId );

			if ( isReverse ) {
				const tabbables = focus.tabbable.find( wrapper );
				const lastTabbable = last( tabbables ) || wrapper;
				lastTabbable.focus();
			} else {
				wrapper.focus();
			}
		}

		return (
			<div
				ref={ ref }
				// Don't allow tabbing to this element in Navigation mode.
				tabIndex={ ! isNavigationMode ? '0' : undefined }
				onFocus={ onFocus }
				// Needs to be positioned within the viewport, so focus to this
				// element does not scroll the page.
				style={ { position: 'fixed' } }
			/>
		);
	}
);

export default FocusCapture;
