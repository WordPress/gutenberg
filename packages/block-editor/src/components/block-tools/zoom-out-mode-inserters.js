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
import PatternsExplorerModal from '../inserter/block-patterns-explorer';
import { allPatternsCategory } from '../inserter/block-patterns-tab/utils';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

function ZoomOutModeInserters() {
	const [ isReady, setIsReady ] = useState( false );
	const [ isPatternsExplorerOpen, setIsPatternsExplorerOpen ] =
		useState( false );
	const {
		hasSelection,
		blockOrder,
		sectionRootClientId,
		selectedBlockClientId,
		blockInsertionPoint,
		insertionPointVisible,
	} = useSelect( ( select ) => {
		const {
			getBlockOrder,
			getSelectionStart,
			getSelectedBlockClientId,
			getSectionRootClientId,
			getBlockInsertionPoint,
			isBlockInsertionPointVisible,
		} = unlock( select( blockEditorStore ) );

		const root = getSectionRootClientId();

		return {
			hasSelection: !! getSelectionStart().clientId,
			blockOrder: getBlockOrder( root ),
			sectionRootClientId: root,
			selectedBlockClientId: getSelectedBlockClientId(),
			blockInsertionPoint: getBlockInsertionPoint(),
			insertionPointVisible: isBlockInsertionPointVisible(),
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

	if ( ! isReady || ! hasSelection ) {
		return null;
	}

	const previousClientId = selectedBlockClientId;
	const index = blockOrder.findIndex(
		( clientId ) => selectedBlockClientId === clientId
	);

	const insertionIndex = index + 1;

	const nextClientId = blockOrder[ insertionIndex ];

	// If the block insertion point is visible, and the insertion
	// Indices match then we don't need to render the inserter.
	if (
		insertionPointVisible &&
		blockInsertionPoint?.index === insertionIndex
	) {
		return null;
	}

	return (
		<>
			<BlockPopoverInbetween
				previousClientId={ previousClientId }
				nextClientId={ nextClientId }
			>
				<ZoomOutModeInserterButton
					onClick={ () => setIsPatternsExplorerOpen( true ) }
				/>
			</BlockPopoverInbetween>
			{ isPatternsExplorerOpen && (
				<PatternsExplorerModal
					initialCategory={ allPatternsCategory }
					rootClientId={ sectionRootClientId }
					insertionIndex={ insertionIndex }
					onModalClose={ () => setIsPatternsExplorerOpen( false ) }
				/>
			) }
		</>
	);
}

export default ZoomOutModeInserters;
