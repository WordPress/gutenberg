/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useState, useCallback } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import Inserter from '../inserter';

function BlockInsertionPoint( { rootClientId, clientId } ) {
	const [ isInserterFocused, setIsInserterFocused ] = useState( false );

	const onFocusInserter = useCallback( ( event ) => {
		// Stop propagation of the focus event to avoid selecting the current
		// block while inserting a new block, as it is not relevant to sibling
		// insertion and conflicts with contextual toolbar placement.
		event.stopPropagation();

		setIsInserterFocused( true );
	}, [] );

	const onBlurInserter = useCallback( () => setIsInserterFocused( false ), [] );

	const { showInsertionPoint } = useSelect( ( select ) => {
		const {
			getBlockIndex,
			getBlockInsertionPoint,
			isBlockInsertionPointVisible,
		} = select( 'core/block-editor' );
		const blockIndex = getBlockIndex( clientId, rootClientId );
		const insertionPoint = getBlockInsertionPoint();
		return {
			showInsertionPoint: (
				isBlockInsertionPointVisible() &&
				insertionPoint.index === blockIndex &&
				insertionPoint.rootClientId === rootClientId
			),
		};
	}, [ clientId, rootClientId ] );

	const { selectBlock, selectPreviousBlock } = useDispatch( 'core/block-editor' );

	const selectAdjacentBlock = useCallback( ( event ) => {
		const { currentTarget } = event;
		const targetRect = currentTarget.getBoundingClientRect();
		const yPercent = ( event.clientY - targetRect.top ) / targetRect.height;

		selectBlock( null );

		const caretRect = new window.DOMRect( event.clientX, targetRect.top, 0, 28 );
		if ( yPercent > 0.5 ) {
			selectBlock( clientId, { caretRect } );
		} else {
			selectPreviousBlock( clientId, { isReverse: true, caretRect } );
		}

		// Prevent the `focus` event from firing, which would otherwise trigger
		// the block's fallback focus handling selection.
		event.preventDefault();
	}, [ clientId ] );

	// Disable reason: The mouse interaction is not an essential interaction,
	// and merely serves as convenience redirect to select the adjacent block.

	/* eslint-disable jsx-a11y/no-static-element-interactions */
	return (
		<div
			onMouseDown={ selectAdjacentBlock }
			className="editor-block-list__insertion-point block-editor-block-list__insertion-point"
		>
			{ showInsertionPoint && (
				<div className="editor-block-list__insertion-point-indicator block-editor-block-list__insertion-point-indicator" />
			) }
			<div
				onFocus={ onFocusInserter }
				onBlur={ onBlurInserter }
				// While ideally it would be enough to capture the
				// bubbling focus event from the Inserter, due to the
				// characteristics of click focusing of `button`s in
				// Firefox and Safari, it is not reliable.
				//
				// See: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#Clicking_and_focus
				tabIndex={ -1 }
				className={
					classnames( 'editor-block-list__insertion-point-inserter block-editor-block-list__insertion-point-inserter', {
						'is-visible': isInserterFocused,
					} )
				}
			>
				<Inserter
					rootClientId={ rootClientId }
					clientId={ clientId }
				/>
			</div>
		</div>
	);
	/* eslint-enable jsx-a11y/no-static-element-interactions */
}

export default BlockInsertionPoint;
