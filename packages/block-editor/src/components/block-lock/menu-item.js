/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useReducer } from '@wordpress/element';
import { MenuItem } from '@wordpress/components';
import { lock, unlock } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import BlockLockModal from './modal';

export default function BlockLockMenuItem( {
	blockTitle,
	clientId,
	isLocked,
} ) {
	const [ isModalOpen, toggleModal ] = useReducer(
		( isActive ) => ! isActive,
		false
	);

	const label = isLocked
		? sprintf(
				/* translators: %s: block name */
				__( 'Unlock %s' ),
				blockTitle
		  )
		: sprintf(
				/* translators: %s: block name */
				__( 'Lock %s' ),
				blockTitle
		  );

	return (
		<>
			<MenuItem icon={ isLocked ? unlock : lock } onClick={ toggleModal }>
				{ label }
			</MenuItem>
			{ isModalOpen && (
				<BlockLockModal clientId={ clientId } onClose={ toggleModal } />
			) }
		</>
	);
}
