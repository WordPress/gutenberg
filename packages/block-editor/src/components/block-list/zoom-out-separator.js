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
import { __ } from '@wordpress/i18n';

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
		blockInsertionPoint,
		blockInsertionPointVisible,
	} = useSelect( ( select ) => {
		const {
			getBlockInsertionPoint,
			getBlockOrder,
			isBlockInsertionPointVisible,
			getSectionRootClientId,
		} = unlock( select( blockEditorStore ) );

		const root = getSectionRootClientId();
		const sectionRootClientIds = getBlockOrder( root );
		return {
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

	if ( position === 'top' ) {
		isVisible =
			blockInsertionPointVisible &&
			blockInsertionPoint.index === 0 &&
			clientId === sectionClientIds[ blockInsertionPoint.index ];
	}

	if ( position === 'bottom' ) {
		isVisible =
			blockInsertionPointVisible &&
			clientId === sectionClientIds[ blockInsertionPoint.index - 1 ];
	}

	return (
		<AnimatePresence>
			{ isVisible && (
				<motion.div
					initial={ { height: 0 } }
					animate={ {
						// Use a height equal to that of the zoom out frame size.
						height: 'calc(1.5 * var(--wp-block-editor-iframe-zoom-out-frame-size) / var(--wp-block-editor-iframe-zoom-out-scale)',
					} }
					exit={ { height: 0 } }
					transition={ {
						type: 'tween',
						duration: isReducedMotion ? 0 : 0.2,
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
				>
					<motion.div
						initial={ { opacity: 0 } }
						animate={ { opacity: 1 } }
						exit={ { opacity: 0, transition: { delay: -0.125 } } }
						transition={ {
							ease: 'linear',
							duration: 0.1,
							delay: 0.125,
						} }
					>
						{ __( 'Drop pattern.' ) }
					</motion.div>
				</motion.div>
			) }
		</AnimatePresence>
	);
}
