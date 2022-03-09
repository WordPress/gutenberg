/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useReducer } from '@wordpress/element';
import { MenuItem } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { lock, unlock } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import BlockLockModal from './modal';
import useBlockDisplayInformation from '../use-block-display-information';
import { store as blockEditorStore } from '../../store';

export default function BlockLockMenuItem( { clientId } ) {
	const blockInformation = useBlockDisplayInformation( clientId );
	const { isLocked } = useSelect(
		( select ) => {
			const { canMoveBlock, canRemoveBlock } = select( blockEditorStore );

			return {
				isLocked:
					! canMoveBlock( clientId ) || ! canRemoveBlock( clientId ),
			};
		},
		[ clientId ]
	);

	const [ isModalOpen, toggleModal ] = useReducer(
		( isActive ) => ! isActive,
		false
	);

	const label = isLocked
		? sprintf(
				/* translators: %s: block name */
				__( 'Unlock %s' ),
				blockInformation.title
		  )
		: sprintf(
				/* translators: %s: block name */
				__( 'Lock %s' ),
				blockInformation.title
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
