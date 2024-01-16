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

const {
	DropdownMenuItemV2: DropdownMenuItem,
	DropdownMenuItemLabelV2: DropdownMenuItemLabel,
} = unlockPrivateApis( componentsPrivateApis );

/* TODO: check if this used in other legacy dropdown menus */
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
			<DropdownMenuItem
				prefix={
					<Icon
						size={ 24 }
						icon={ isLocked ? unlock : lockOutline }
					/>
				}
				onClick={ toggleModal }
				hideOnClick={ false }
				aria-expanded={ isModalOpen }
				aria-haspopup="dialog"
			>
				<DropdownMenuItemLabel>{ label }</DropdownMenuItemLabel>
			</DropdownMenuItem>
			{ isModalOpen && (
				<BlockLockModal clientId={ clientId } onClose={ toggleModal } />
			) }
		</>
	);
}
