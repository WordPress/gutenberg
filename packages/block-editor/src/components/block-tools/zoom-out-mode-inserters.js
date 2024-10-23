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
		selectedSectionClientId,
		blockOrder,
		setInserterIsOpened,
		sectionRootClientId,
	} = useSelect( ( select ) => {
		const {
			getSettings,
			getBlockOrder,
			getSelectedBlockClientId,
			getSectionRootClientId,
			isSectionBlock,
			getParentSectionBlock,
		} = unlock( select( blockEditorStore ) );

		const root = getSectionRootClientId();
		const selectionBlockClientId = getSelectedBlockClientId();
		const _selectedSectionClientId =
			! selectionBlockClientId || isSectionBlock( selectionBlockClientId )
				? selectionBlockClientId
				: getParentSectionBlock( selectionBlockClientId );

		return {
			selectedSectionClientId: _selectedSectionClientId,
			blockOrder: getBlockOrder( root ),
			sectionRootClientId: root,
			setInserterIsOpened:
				getSettings().__experimentalSetIsInserterOpened,
			selectedBlockClientId: getSelectedBlockClientId(),
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

	if ( ! isReady || ! selectedSectionClientId ) {
		return null;
	}

	const previousClientId = selectedSectionClientId;
	const index = blockOrder.findIndex(
		( clientId ) => selectedSectionClientId === clientId
	);
	const nextClientId = blockOrder[ index + 1 ];

	return (
		<BlockPopoverInbetween
			previousClientId={ previousClientId }
			nextClientId={ nextClientId }
		>
			<ZoomOutModeInserterButton
				onClick={ () => {
					setInserterIsOpened( {
						rootClientId: sectionRootClientId,
						insertionIndex: index + 1,
						tab: 'patterns',
						category: 'all',
					} );
					showInsertionPoint( sectionRootClientId, index + 1, {
						operation: 'insert',
					} );
				} }
			/>
		</BlockPopoverInbetween>
	);
}

export default ZoomOutModeInserters;
