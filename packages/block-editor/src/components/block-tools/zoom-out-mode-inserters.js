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
	} = useSelect( ( select ) => {
		const {
			getSettings,
			getInsertionPoint,
			getBlockOrder,
			getSelectionStart,
			getSelectedBlockClientId,
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

	return [ undefined, ...blockOrder ].map( ( clientId, index ) => {
		const shouldRenderInsertionPoint =
			blockInsertionPointVisible && insertionPoint?.index === index;

		const previousClientId = clientId;
		const nextClientId = blockOrder[ index ];

		const isSelected =
			selectedBlockClientId === previousClientId ||
			selectedBlockClientId === nextClientId;

		return (
			<BlockPopoverInbetween
				key={ index }
				previousClientId={ previousClientId }
				nextClientId={ nextClientId }
			>
				{ ! shouldRenderInsertionPoint && isSelected && (
					<ZoomOutModeInserterButton
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
						} }
					/>
				) }
			</BlockPopoverInbetween>
		);
	} );
}

export default ZoomOutModeInserters;
