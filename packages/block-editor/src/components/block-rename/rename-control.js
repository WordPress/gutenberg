/**
 * WordPress dependencies
 */
import { MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockRenameModal from './modal';

export default function BlockRenameControl( { clientId } ) {
	const [ renamingBlock, setRenamingBlock ] = useState( false );

	return (
		<>
			<MenuItem
				onClick={ () => {
					setRenamingBlock( true );
				} }
				aria-expanded={ renamingBlock }
				aria-haspopup="dialog"
			>
				{ __( 'Rename' ) }
			</MenuItem>
			{ renamingBlock && (
				<BlockRenameModal
					clientId={ clientId }
					onClose={ () => setRenamingBlock( false ) }
				/>
			) }
		</>
	);
}
