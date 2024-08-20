/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
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
		blockInsertionPoint,
		blockOrder,
		blockInsertionPointVisible,
		setInserterIsOpened,
		sectionRootClientId,
		selectedBlockClientId,
		hoveredBlockClientId,
		inserterSearchInputRef,
	} = useSelect( ( select ) => {
		const {
			getSettings,
			getBlockInsertionPoint,
			getBlockOrder,
			getSelectionStart,
			getSelectedBlockClientId,
			getHoveredBlockClientId,
			isBlockInsertionPointVisible,
			getInserterSearchInputRef,
		} = unlock( select( blockEditorStore ) );

		const { sectionRootClientId: root } = unlock( getSettings() );

		return {
			hasSelection: !! getSelectionStart().clientId,
			blockInsertionPoint: getBlockInsertionPoint(),
			blockOrder: getBlockOrder( root ),
			blockInsertionPointVisible: isBlockInsertionPointVisible(),
			sectionRootClientId: root,
			setInserterIsOpened:
				getSettings().__experimentalSetIsInserterOpened,
			selectedBlockClientId: getSelectedBlockClientId(),
			hoveredBlockClientId: getHoveredBlockClientId(),
			inserterSearchInputRef: getInserterSearchInputRef(),
		};
	}, [] );

	const { showInsertionPoint } = useDispatch( blockEditorStore );

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
		const shouldRenderInsertionPoint =
			blockInsertionPointVisible && blockInsertionPoint.index === index;

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
				{ ! shouldRenderInsertionPoint && (
					<ZoomOutModeInserterButton
						isVisible={ isSelected || isHovered }
						onClick={ () => {
							setInserterIsOpened( {
								rootClientId: sectionRootClientId,
								insertionIndex: index,
								tab: 'patterns',
								category: 'all',
							} );
							showInsertionPoint( sectionRootClientId, index, {
								operation: 'insert',
							} );
							inserterSearchInputRef?.current?.focus();
						} }
					/>
				) }
			</BlockPopoverInbetween>
		);
	} );
}

export default ZoomOutModeInserters;
