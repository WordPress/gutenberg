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
		blockOrder,
		setInserterIsOpened,
		sectionRootClientId,
		selectedBlockClientId,
	} = useSelect( ( select ) => {
		const {
			getSettings,
			getBlockOrder,
			getSelectionStart,
			getSelectedBlockClientId,
			getSectionRootClientId,
		} = unlock( select( blockEditorStore ) );

		const root = getSectionRootClientId();

		return {
			hasSelection: !! getSelectionStart().clientId,
			blockOrder: getBlockOrder( root ),
			sectionRootClientId: root,
			setInserterIsOpened:
				getSettings().__experimentalSetIsInserterOpened,
			selectedBlockClientId: getSelectedBlockClientId(),
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

	if ( ! isReady || ! hasSelection ) {
		return null;
	}

	const previousClientId = selectedBlockClientId;
	const index = blockOrder.findIndex(
		( clientId ) => selectedBlockClientId === clientId
	);
	const nextClientId = blockOrder[ index + 1 ];

	return (
		<BlockPopoverInbetween
			previousClientId={ previousClientId }
			nextClientId={ nextClientId }
		>
			<ZoomOutModeInserterButton
				onClick={ () => {
					// Hotfix for wp/6.7 where focus is not transferred to the sidebar if the
					// block library is already open.
					const blockLibrary = document.querySelector(
						'[aria-label="Block Library"]'
					);

					setInserterIsOpened( {
						rootClientId: sectionRootClientId,
						insertionIndex: index + 1,
						tab: 'patterns',
						category: 'all',
					} );
					showInsertionPoint( sectionRootClientId, index + 1, {
						operation: 'insert',
					} );

					// If the block library was available before we opened it with `setInserterIsOpened`, we need to
					// send focus to the block library.
					if ( blockLibrary ) {
						blockLibrary.focus();
					}
				} }
			/>
		</BlockPopoverInbetween>
	);
}

export default ZoomOutModeInserters;
