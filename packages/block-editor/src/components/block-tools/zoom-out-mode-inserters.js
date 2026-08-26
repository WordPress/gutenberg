import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import BlockPopoverInbetween from '../block-popover/inbetween';
import ZoomOutModeInserterButton from './zoom-out-mode-inserter-button';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

function ZoomOutModeInserters() {
	const [ isReady, setIsReady ] = useState( false );
	const {
		hasSelection,
		blockOrder,
		setInserterIsOpened,
		sectionRootClientId,
		selectedBlockClientId,
		blockInsertionPoint,
		insertionPointVisible,
	} = useSelect( ( select ) => {
		const {
			getSettings,
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
			setInserterIsOpened:
				getSettings().__experimentalSetIsInserterOpened,
			selectedBlockClientId: getSelectedBlockClientId(),
			blockInsertionPoint: getBlockInsertionPoint(),
			insertionPointVisible: isBlockInsertionPointVisible(),
		};
	}, [] );

	// eslint-disable-next-line @wordpress/no-unused-vars-before-return
	const { showInsertionPoint } = unlock( useDispatch( blockEditorStore ) );

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
		<BlockPopoverInbetween
			previousClientId={ previousClientId }
			nextClientId={ nextClientId }
			// Only one of these is ever mounted at a time here (it tracks
			// the current block selection, not hover), so there's no
			// performance need to hide it while off-screen — and doing so
			// made the inserter for a tall selected block unreachable by
			// keyboard whenever its lower boundary was scrolled out of
			// view. See https://github.com/WordPress/gutenberg/issues/66346.
			alwaysVisible
		>
			<ZoomOutModeInserterButton
				onClick={ () => {
					setInserterIsOpened( {
						rootClientId: sectionRootClientId,
						insertionIndex,
						tab: 'patterns',
						category: 'all',
					} );
					showInsertionPoint( sectionRootClientId, insertionIndex, {
						operation: 'insert',
					} );
				} }
			/>
		</BlockPopoverInbetween>
	);
}

export default ZoomOutModeInserters;
