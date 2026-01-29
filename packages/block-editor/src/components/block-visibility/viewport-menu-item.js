/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { MenuItem } from '@wordpress/components';
import { seen, unseen } from '@wordpress/icons';
import { useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { BlockVisibilityModal } from './';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

export default function BlockVisibilityViewportMenuItem( { clientIds } ) {
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const { areBlocksHiddenAnywhere } = useSelect(
		( select ) => {
			const { isBlockHiddenAnywhere } = unlock(
				select( blockEditorStore )
			);
			return {
				areBlocksHiddenAnywhere: clientIds?.every( ( clientId ) =>
					isBlockHiddenAnywhere( clientId )
				),
			};
		},
		[ clientIds ]
	);
	return (
		<>
			<MenuItem
				icon={ areBlocksHiddenAnywhere ? unseen : seen }
				onClick={ () => setIsModalOpen( true ) }
			>
				{ areBlocksHiddenAnywhere ? __( 'Show' ) : __( 'Hide' ) }
			</MenuItem>
			{ isModalOpen && (
				<BlockVisibilityModal
					clientIds={ clientIds }
					onClose={ () => setIsModalOpen( false ) }
				/>
			) }
		</>
	);
}
