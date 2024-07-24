/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockPopoverInbetween from '../block-popover/inbetween';
import ZoomOutModeInserterButton from './zoom-out-mode-inserter-button';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

function ZoomOutModeInserters() {
	const [ isReady, setIsReady ] = useState( false );
	const {
		hasSelection,
		blockOrder,
		insertionPoint,
		setInserterIsOpened,
		sectionRootClientId,
		selectedBlockClientId,
		hoveredBlockClientId,
	} = useSelect( ( select ) => {
		const {
			getSettings,
			getBlockOrder,
			getSelectionStart,
			getSelectedBlockClientId,
			getHoveredBlockClientId,
		} = select( blockEditorStore );
		const { sectionRootClientId: root } = unlock( getSettings() );
		// To do: move ZoomOutModeInserters to core/editor.
		// Or we perhaps we should move the insertion point state to the
		// block-editor store. I'm not sure what it was ever moved to the editor
		// store, because all the inserter components all live in the
		// block-editor package.
		// eslint-disable-next-line @wordpress/data-no-store-string-literals
		const editor = select( 'core/editor' );
		return {
			hasSelection: !! getSelectionStart().clientId,
			blockOrder: getBlockOrder( root ),
			insertionPoint: unlock( editor ).getInsertionPoint(),
			sectionRootClientId: root,
			setInserterIsOpened:
				getSettings().__experimentalSetIsInserterOpened,
			selectedBlockClientId: getSelectedBlockClientId(),
			hoveredBlockClientId: getHoveredBlockClientId(),
		};
	}, [] );

	// Defer the initial rendering to avoid the jumps due to the animation.
	useEffect( () => {
		const timeout = setTimeout( () => {
			setIsReady( true );
		}, 500 );
		return () => {
			clearTimeout( timeout );
		};
	}, [] );

	if ( ! isReady ) {
		return null;
	}

	return [ undefined, ...blockOrder ].map( ( clientId, index ) => {
		const shouldRenderInserter = insertionPoint.insertionIndex !== index;

		const shouldRenderInsertionPoint =
			insertionPoint.insertionIndex === index;

		if ( ! shouldRenderInserter && ! shouldRenderInsertionPoint ) {
			return null;
		}

		const previousClientId = clientId;
		const nextClientId = blockOrder[ index ];

		const isSelected =
			hasSelection &&
			( selectedBlockClientId === previousClientId ||
				selectedBlockClientId === nextClientId );

		const isHovered =
			hoveredBlockClientId === previousClientId ||
			hoveredBlockClientId === nextClientId;

		return (
			<BlockPopoverInbetween
				key={ index }
				previousClientId={ previousClientId }
				nextClientId={ nextClientId }
			>
				{ shouldRenderInsertionPoint && (
					<div
						style={ {
							borderRadius: '0',
							height: '12px',
							opacity: 1,
							transform: 'translateY(-50%)',
							width: '100%',
						} }
						className="block-editor-block-list__insertion-point-indicator"
					/>
				) }
				{ shouldRenderInserter && (
					<ZoomOutModeInserterButton
						isVisible={ isSelected || isHovered }
						onClick={ () => {
							setInserterIsOpened( {
								rootClientId: sectionRootClientId,
								insertionIndex: index,
								tab: 'patterns',
								category: 'all',
							} );
						} }
					/>
				) }
			</BlockPopoverInbetween>
		);
	} );
}

export default ZoomOutModeInserters;
