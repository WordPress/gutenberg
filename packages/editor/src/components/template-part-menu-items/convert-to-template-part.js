/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { MenuItem } from '@wordpress/components';
import { createBlock } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { store as noticesStore } from '@wordpress/notices';
import { symbolFilled } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { CreateTemplatePartModal } from '@wordpress/fields';

export default function ConvertToTemplatePart( { clientIds, blocks } ) {
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const { replaceBlocks } = useDispatch( blockEditorStore );
	const { createSuccessNotice } = useDispatch( noticesStore );

	const { canCreate } = useSelect( ( select ) => {
		return {
			canCreate:
				select( blockEditorStore ).canInsertBlockType(
					'core/template-part'
				),
		};
	}, [] );

	if ( ! canCreate ) {
		return null;
	}

	const onConvert = async ( templatePart ) => {
		replaceBlocks(
			clientIds,
			createBlock( 'core/template-part', {
				slug: templatePart.slug,
				theme: templatePart.theme,
			} )
		);
		createSuccessNotice( __( 'Template part created.' ), {
			type: 'snackbar',
		} );

		// The modal and this component will be unmounted because of `replaceBlocks` above,
		// so no need to call `closeModal` or `onClose`.
	};

	return (
		<>
			<MenuItem
				icon={ symbolFilled }
				onClick={ () => {
					setIsModalOpen( true );
				} }
				aria-expanded={ isModalOpen }
				aria-haspopup="dialog"
			>
				{ __( 'Create template part' ) }
			</MenuItem>
			{ isModalOpen && (
				<CreateTemplatePartModal
					closeModal={ () => {
						setIsModalOpen( false );
					} }
					blocks={ blocks }
					onCreate={ onConvert }
				/>
			) }
		</>
	);
}
