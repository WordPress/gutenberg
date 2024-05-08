/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { plus } from '@wordpress/icons';
import { _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockPopoverInbetween from '../block-popover/inbetween';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

function Inserter( {
	previousClientId,
	nextClientId,
	sectionRootClientId,
	__unstableContentRef,
	index,
} ) {
	const { setInserterIsOpened, insertionIndex } = useSelect(
		( select ) => {
			const { getSettings, getBlockCount } = select( blockEditorStore );
			const settings = getSettings();
			return {
				setInserterIsOpened: settings.__experimentalSetIsInserterOpened,
				insertionIndex: index === -1 ? getBlockCount() : index,
			};
		},
		[ index ]
	);

	const label = _x(
		'Add pattern',
		'Generic label for pattern inserter button'
	);
	return (
		<BlockPopoverInbetween
			previousClientId={ previousClientId }
			nextClientId={ nextClientId }
			__unstableContentRef={ __unstableContentRef }
			className="block-editor-button-pattern-inserter"
		>
			<Button
				variant="primary"
				icon={ plus }
				size="compact"
				className="block-editor-button-pattern-inserter__button"
				onClick={ () => {
					setInserterIsOpened( {
						rootClientId: sectionRootClientId,
						insertionIndex,
						tab: 'patterns',
						category: 'all',
					} );
				} }
				label={ label }
			/>
		</BlockPopoverInbetween>
	);
}

function ZoomOutModeInserters( { __unstableContentRef } ) {
	const [ isReady, setIsReady ] = useState( false );
	const { blockOrder, sectionRootClientId } = useSelect( ( select ) => {
		const { sectionRootClientId: root } = unlock(
			select( blockEditorStore ).getSettings()
		);
		return {
			blockOrder: select( blockEditorStore ).getBlockOrder( root ),
			sectionRootClientId: root,
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

	if ( ! isReady ) {
		return null;
	}

	return [ undefined, ...blockOrder ].map( ( clientId, index ) => {
		if ( index === blockOrder.length - 1 ) {
			return null;
		}
		return (
			<Inserter
				key={ index }
				previousClientId={ clientId }
				nextClientId={ blockOrder[ index ] }
				sectionRootClientId={ sectionRootClientId }
				index={ index }
				blockOrder={ blockOrder }
				__unstableContentRef={ __unstableContentRef }
			/>
		);
	} );
}

export default ZoomOutModeInserters;
