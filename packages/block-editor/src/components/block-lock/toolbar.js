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
	const { canMove } = useSelect(
		( select ) => {
			const { canMoveBlock } = select( blockEditorStore );

			return {
				canMove: canMoveBlock( clientId ),
			};
		},
		[ clientId ]
	);

	const [ isModalOpen, toggleModal ] = useReducer(
		( isActive ) => ! isActive,
		false
	);

	if ( canMove ) {
		return null;
	}

	return (
		<div className="block-editor-block-lock-toolbar">
			<ToolbarGroup>
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
		</div>
	);
}
