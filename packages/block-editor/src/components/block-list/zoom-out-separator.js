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

export function ZoomOutSeparator( { clientId, rootClientId = '' } ) {
	const [ isDraggedOver, setIsDraggedOver ] = useState( false );
	const {
		sectionRootClientId,
		sectionClientIds,
		isBlockSelected,
		blockInsertionPoint,
		blockInsertionPointVisible,
	} = useSelect( ( select ) => {
		const {
			getBlockInsertionPoint,
			getBlockOrder,
			isBlockInsertionPointVisible,
			getSectionRootClientId,
			isBlockSelected: _isBlockSelected,
		} = unlock( select( blockEditorStore ) );

		const root = getSectionRootClientId();
		const sectionRootClientIds = getBlockOrder( root );
		return {
			isBlockSelected: _isBlockSelected,
			sectionRootClientId: root,
			sectionClientIds: sectionRootClientIds,
			blockOrder: getBlockOrder( root ),
			blockInsertionPoint: getBlockInsertionPoint(),
			blockInsertionPointVisible: isBlockInsertionPointVisible(),
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

	isVisible =
		isBlockSelected( clientId ) ||
		( blockInsertionPointVisible &&
			clientId === sectionClientIds[ blockInsertionPoint.index ] );

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
