/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { useReducer } from '@wordpress/element';
import { lock } from '@wordpress/icons';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import BlockLockModal from './modal';
import useBlockDisplayInformation from '../use-block-display-information';
import { store as blockEditorStore } from '../../store';

export default function BlockLockToolbar( { clientId } ) {
	const blockInformation = useBlockDisplayInformation( clientId );
	const { canMove, canRemove, canLockBlocks } = useSelect(
		( select ) => {
			const { canMoveBlock, canRemoveBlock, getSettings } = select(
				blockEditorStore
			);

			return {
				canMove: canMoveBlock( clientId ),
				canRemove: canRemoveBlock( clientId ),
				canLockBlocks: getSettings().__experimentalCanLockBlocks,
			};
		},
		[ clientId ]
	);

	const [ isModalOpen, toggleModal ] = useReducer(
		( isActive ) => ! isActive,
		false
	);

	if ( ! canLockBlocks ) {
		return null;
	}

	if ( canMove && canRemove ) {
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
