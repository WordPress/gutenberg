/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	__unstableMotion as motion,
	__unstableAnimatePresence as AnimatePresence,
} from '@wordpress/components';
import { useReducedMotion } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

export function ZoomOutSeparator( {
	clientId,
	rootClientId = '',
	position = 'top',
} ) {
	const [ isDraggedOver, setIsDraggedOver ] = useState( false );
	const {
		sectionRootClientId,
		sectionClientIds,
		insertionPoint,
		insertionCueIsVisible,
		insertionCue,
	} = useSelect( ( select ) => {
		const {
			getInsertionPoint,
			getBlockOrder,
			getSectionRootClientId,
			isInsertionCueVisible,
			getInsertionCue,
		} = unlock( select( blockEditorStore ) );

		const root = getSectionRootClientId();
		const sectionRootClientIds = getBlockOrder( root );
		return {
			sectionRootClientId: root,
			sectionClientIds: sectionRootClientIds,
			blockOrder: getBlockOrder( root ),
			insertionPoint: getInsertionPoint(),
			insertionCueIsVisible: isInsertionCueVisible(),
			insertionCue: getInsertionCue(),
		};
	}, [] );

	const isReducedMotion = useReducedMotion();

	if ( ! clientId ) {
		return;
	}

	let isVisible = false;

	const isSectionBlock =
		rootClientId === sectionRootClientId &&
		sectionClientIds &&
		sectionClientIds.includes( clientId );

	if ( ! isSectionBlock ) {
		return null;
	}

	const hasTopinsertionPoint =
		insertionPoint?.index === 0 &&
		clientId === sectionClientIds[ insertionPoint.index ];
	const hasBottomInsertionPoint =
		insertionPoint &&
		clientId === sectionClientIds[ insertionPoint.index - 1 ];
	// We want to show the zoom out separator in either of these conditions:
	// 1. If the inserter has an insertion index set
	// 2. We are dragging a pattern over an insertion point
	if ( position === 'top' ) {
		isVisible =
			hasTopinsertionPoint ||
			( insertionCueIsVisible &&
				insertionCue.index === 0 &&
				clientId === sectionClientIds[ insertionCue.index ] );
	}

	if ( position === 'bottom' ) {
		isVisible =
			hasBottomInsertionPoint ||
			( insertionCueIsVisible &&
				clientId === sectionClientIds[ insertionCue.index - 1 ] );
	}

	return (
		<AnimatePresence>
			{ isVisible && (
				<motion.div
					as="button"
					layout={ ! isReducedMotion }
					initial={ { height: 0 } }
					animate={ { height: '120px' } }
					exit={ { height: 0 } }
					transition={ {
						type: 'tween',
						duration: 0.2,
						ease: [ 0.6, 0, 0.4, 1 ],
					} }
					className={ clsx(
						'block-editor-block-list__zoom-out-separator',
						{
							'is-dragged-over': isDraggedOver,
						}
					) }
					data-is-insertion-point="true"
					onDragOver={ () => setIsDraggedOver( true ) }
					onDragLeave={ () => setIsDraggedOver( false ) }
				></motion.div>
			) }
		</AnimatePresence>
	);
}
