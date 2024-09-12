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
		insertionPoint,
		blockOrder,
		blockInsertionPointVisible,
		setInserterIsOpened,
		sectionRootClientId,
		selectedBlockClientId,
		hoveredBlockClientId,
	} = useSelect( ( select ) => {
		const {
			getSettings,
			getInsertionPoint,
			getBlockOrder,
			getSelectionStart,
			getSelectedBlockClientId,
			getHoveredBlockClientId,
			getSectionRootClientId,
			isBlockInsertionPointVisible,
		} = unlock( select( blockEditorStore ) );

		const root = getSectionRootClientId();

		return {
			hasSelection: !! getSelectionStart().clientId,
			insertionPoint: getInsertionPoint(),
			blockOrder: getBlockOrder( root ),
			blockInsertionPointVisible: isBlockInsertionPointVisible(),
			sectionRootClientId: root,
			setInserterIsOpened:
				getSettings().__experimentalSetIsInserterOpened,
			selectedBlockClientId: getSelectedBlockClientId(),
			hoveredBlockClientId: getHoveredBlockClientId(),
		};
	}, [] );

	// eslint-disable-next-line @wordpress/no-unused-vars-before-return
	const { showInsertionCue, setInsertionPoint } = unlock(
		useDispatch( blockEditorStore )
	);

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
			blockInsertionPointVisible &&
			insertionPoint?.insertionIndex === index;

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
				{ ! shouldRenderInsertionPoint && (
					<ZoomOutModeInserterButton
						isVisible={ isSelected || isHovered }
						onClick={ () => {
							setInserterIsOpened( {
								tab: 'patterns',
								category: 'all',
							} );
							setInsertionPoint( {
								rootClientId: sectionRootClientId,
								index,
							} );
							showInsertionCue( sectionRootClientId, index, {
								operation: 'insert',
							} );
						} }
					/>
				) }
			</BlockPopoverInbetween>
		);
	} );
}

export default ZoomOutModeInserters;
