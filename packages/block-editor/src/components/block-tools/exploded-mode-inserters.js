/**
 * External dependencies
 */
import { throttle } from 'lodash';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockPopoverInbetween from '../block-popover/inbetween';
import { store as blockEditorStore } from '../../store';
import Inserter from '../inserter';
import { __unstableUseBlockElement } from '../block-list/use-block-props/use-block-refs';

function useIsScrolling() {
	const [ isScrolling, setIsScrolling ] = useState( false );

	const clientId = useSelect( ( select ) => {
		return select( blockEditorStore ).getBlockOrder()?.[ 0 ];
	}, [] );
	const element = __unstableUseBlockElement( clientId );

	useEffect( () => {
		let timeout;
		setIsScrolling( false );
		if ( ! element ) {
			return;
		}
		const onScroll = throttle( () => {
			setIsScrolling( true );
			clearTimeout( timeout );
			timeout = setTimeout( () => {
				setIsScrolling( false );
			}, 100 );
		}, 100 );

		element.ownerDocument.defaultView.addEventListener(
			'scroll',
			onScroll
		);
		return () => {
			clearTimeout( timeout );
			element.ownerDocument.defaultView.removeEventListener(
				'scroll',
				onScroll
			);
		};
	}, [ element ] );

	return isScrolling;
}

function ExplodedModeInserters( { __unstableContentRef } ) {
	const isScrolling = useIsScrolling();
	const blockOrder = useSelect( ( select ) => {
		return select( blockEditorStore ).getBlockOrder();
	}, [] );

	if ( isScrolling ) {
		return null;
	}

	return blockOrder.map( ( clientId, index ) => {
		if ( index === blockOrder.length - 1 ) {
			return null;
		}
		return (
			<BlockPopoverInbetween
				key={ clientId }
				previousClientId={ clientId }
				nextClientId={ blockOrder[ index + 1 ] }
				__unstableContentRef={ __unstableContentRef }
			>
				<div className="block-editor-block-list__insertion-point-inserter">
					<Inserter
						position="bottom center"
						clientId={ blockOrder[ index + 1 ] }
						__experimentalIsQuick
					/>
				</div>
			</BlockPopoverInbetween>
		);
	} );
}

export default ExplodedModeInserters;
