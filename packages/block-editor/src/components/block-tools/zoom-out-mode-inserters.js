/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useEffect, useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockPopoverInbetween from '../block-popover/inbetween';
import ZoomOutModeInserterButton from './zoom-out-mode-inserter-button';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

function ZoomOutModeInserters() {
	const [ isReady, setIsReady ] = useState( false );
	const { blockOrder, insertionPoint, setInserterIsOpened } = useSelect(
		( select ) => {
			const {
				getSettings,
				getBlockOrder,
				getSelectionStart,
				getSelectedBlockClientId,
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
			};
		},
		[]
	);

	const isMounted = useRef( false );

	useEffect( () => {
		if ( ! isMounted.current ) {
			isMounted.current = true;
			return;
		}
		// reset insertion point when the block order changes
		setInserterIsOpened( true );
	}, [ blockOrder, setInserterIsOpened ] );

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

		return (
			<BlockPopoverInbetween
				key={ index }
				previousClientId={ clientId }
				nextClientId={ blockOrder[ index ] }
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
						previousClientId={ clientId }
						nextClientId={ blockOrder[ index ] }
						index={ index }
					/>
				) }
			</BlockPopoverInbetween>
		);
	} );
}

export default ZoomOutModeInserters;
