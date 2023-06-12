/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useReducer } from '@wordpress/element';
import {
	Icon,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { lockOutline, unlock } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import useBlockLock from './use-block-lock';
import BlockLockModal from './modal';
import { unlock as unlockPrivateApis } from '../../lock-unlock';

const { DropdownMenuItemV2 } = unlockPrivateApis( componentsPrivateApis );

export default function BlockLockMenuItem( { clientId } ) {
	const { canLock, isLocked } = useBlockLock( clientId );

	const [ isModalOpen, toggleModal ] = useReducer(
		( isActive ) => ! isActive,
		false
	);

	if ( ! canLock ) {
		return null;
	}

	const label = isLocked ? __( 'Unlock' ) : __( 'Lock' );

	return (
		<>
			{ /* TODO: check if this used in other legacy dropdown menus */ }
			<DropdownMenuItemV2
				prefix={
					<Icon
						icon={ isLocked ? unlock : lockOutline }
						size={ 24 }
					/>
				}
				onClick={ toggleModal }
			>
				{ label }
			</DropdownMenuItemV2>
			{ isModalOpen && (
				<BlockLockModal clientId={ clientId } onClose={ toggleModal } />
			) }
		</>
	);
}
