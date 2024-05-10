/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useEffect, useRef, useState } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { plus } from '@wordpress/icons';
import { _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockPopoverInbetween from '../block-popover/inbetween';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

function ZoomOutModeInserters() {
	const [ isReady, setIsReady ] = useState( false );
	const {
		blockOrder,
		sectionRootClientId,
		insertionPoint,
		setInserterIsOpened,
	} = useSelect( ( select ) => {
		const { getSettings, getBlockOrder } = select( blockEditorStore );
		const { sectionRootClientId: root } = unlock( getSettings() );
		// To do: move ZoomOutModeInserters to core/editor.
		// Or we perhaps we should move the insertion point state to the
		// block-editor store. I'm not sure what it was ever moved to the editor
		// store, because all the inserter components all live in the
		// block-editor package.
		// eslint-disable-next-line @wordpress/data-no-store-string-literals
		const editor = select( 'core/editor' );
		return {
			blockOrder: getBlockOrder( root ),
			insertionPoint: unlock( editor ).getInsertionPoint(),
			sectionRootClientId: root,
			setInserterIsOpened:
				getSettings().__experimentalSetIsInserterOpened,
		};
	}, [] );

	const isMounted = useRef( false );

	useEffect( () => {
		if ( ! isMounted.current ) {
			isMounted.current = true;
			return;
		}
		// reset insertion point when the block order changes
		setInserterIsOpened( true );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ blockOrder ] );

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
		return (
			<BlockPopoverInbetween
				key={ index }
				previousClientId={ clientId }
				nextClientId={ blockOrder[ index ] }
			>
				{ insertionPoint.insertionIndex === index && (
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
				{ insertionPoint.insertionIndex !== index && (
					<Button
						variant="primary"
						icon={ plus }
						size="compact"
						className="block-editor-button-pattern-inserter__button"
						onClick={ () => {
							setInserterIsOpened( {
								rootClientId: sectionRootClientId,
								insertionIndex: index,
								tab: 'patterns',
								category: 'all',
							} );
						} }
						label={ _x(
							'Add pattern',
							'Generic label for pattern inserter button'
						) }
					/>
				) }
			</BlockPopoverInbetween>
		);
	} );
}

export default ZoomOutModeInserters;
