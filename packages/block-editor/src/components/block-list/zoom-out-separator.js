/**
 * WordPress dependencies
 */
import {
	__unstableMotion as motion,
	__unstableAnimatePresence as AnimatePresence,
} from '@wordpress/components';
import { useReducedMotion } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

export function ZoomOutSeparator( {
	clientId,
	rootClientId,
	position = 'top',
} ) {
	const {
		sectionRootClientId,
		sectionClientIds,
		blockInsertionPoint,
		blockInsertionPointVisible,
	} = useSelect( ( select ) => {
		const {
			getSettings,
			getBlockInsertionPoint,
			getBlockOrder,
			isBlockInsertionPointVisible,
		} = unlock( select( blockEditorStore ) );

		const { sectionRootClientId: root } = unlock( getSettings() );
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

	let isSectionBlock = false;
	let isVisible = false;

	if (
		( sectionRootClientId &&
			sectionClientIds &&
			sectionClientIds.includes( clientId ) ) ||
		( clientId && ! rootClientId )
	) {
		isSectionBlock = true;
	}

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
					layout={ ! isReducedMotion }
					initial={ { height: 0 } }
					animate={ { height: '120px' } }
					exit={ { height: 0 } }
					transition={ {
						type: 'tween',
						duration: 0.2,
						ease: [ 0.6, 0, 0.4, 1 ],
					} }
					className="block-editor-block-list__zoom-out-separator"
				></motion.div>
			) }
		</AnimatePresence>
	);
}
