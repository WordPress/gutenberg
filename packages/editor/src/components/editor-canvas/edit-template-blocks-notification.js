/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { __experimentalConfirmDialog as ConfirmDialog } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

/**
 * Component that:
 *
 * - Displays a 'Edit your template to edit this block' notification when the
 *   user is focusing on editing page content and clicks on a disabled template
 *   block.
 * - Displays a 'Edit your template to edit this block' dialog when the user
 *   is focusing on editing page conetnt and double clicks on a disabled
 *   template block.
 *
 * @param {Object}                                 props
 * @param {import('react').RefObject<HTMLElement>} props.contentRef Ref to the block
 *                                                                  editor iframe canvas.
 */
export default function EditTemplateBlocksNotification( { contentRef } ) {
	const { onNavigateToEntityRecord, templateId } = useSelect( ( select ) => {
		const { getEditorSettings, getCurrentTemplateId } =
			select( editorStore );

		return {
			onNavigateToEntityRecord:
				getEditorSettings().onNavigateToEntityRecord,
			templateId: getCurrentTemplateId(),
		};
	}, [] );

	const [ isDialogOpen, setIsDialogOpen ] = useState( false );

	useEffect( () => {
		const handleDblClick = ( event ) => {
			if ( ! event.target.classList.contains( 'is-root-container' ) ) {
				return;
			}
			setIsDialogOpen( true );
		};

		const canvas = contentRef.current;
		canvas?.addEventListener( 'dblclick', handleDblClick );
		return () => {
			canvas?.removeEventListener( 'dblclick', handleDblClick );
		};
	}, [ contentRef ] );

	return (
		<ConfirmDialog
			isOpen={ isDialogOpen }
			confirmButtonText={ __( 'Edit template' ) }
			onConfirm={ () => {
				setIsDialogOpen( false );
				onNavigateToEntityRecord( {
					postId: templateId,
					postType: 'wp_template',
				} );
			} }
			onCancel={ () => setIsDialogOpen( false ) }
		>
			{ __(
				'Would you like to edit the template this block is part of?'
			) }
		</ConfirmDialog>
	);
}
