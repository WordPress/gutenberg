/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { useReducer } from '@wordpress/element';
import { lock } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import BlockLockModal from './modal';
import useBlockLock from './use-block-lock';
import useBlockDisplayInformation from '../use-block-display-information';

export default function BlockLockToolbar( { clientId } ) {
	const blockInformation = useBlockDisplayInformation( clientId );
	const { canEdit, canMove, canRemove, canLock } = useBlockLock( clientId );

	const [ isModalOpen, toggleModal ] = useReducer(
		( isActive ) => ! isActive,
		false
	);

	if ( ! canLock ) {
		return null;
	}

	if ( canEdit && canMove && canRemove ) {
		return null;
	}

	return (
		<>
			<ToolbarGroup className="block-editor-block-lock-toolbar">
				<ToolbarButton
					icon={ lock }
					label={ sprintf(
						/* translators: %s: block name */
						__( 'Unlock %s' ),
						blockInformation.title
					) }
					onClick={ toggleModal }
				/>
			</ToolbarGroup>
			{ isModalOpen && (
				<BlockLockModal clientId={ clientId } onClose={ toggleModal } />
			) }
		</>
	);
}
