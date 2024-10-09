/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { __experimentalConfirmDialog as ConfirmDialog } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

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
	const { isZoomOut, onNavigateToEntityRecord, templateId } = useSelect(
		( select ) => {
			const { getEditorSettings, getCurrentTemplateId } =
				select( editorStore );

			return {
				isZoomOut: unlock( select( blockEditorStore ) ).isZoomOut(),
				onNavigateToEntityRecord:
					getEditorSettings().onNavigateToEntityRecord,
				templateId: getCurrentTemplateId(),
			};
		},
		[]
	);

	const { resetZoomLevel, __unstableSetEditorMode } = unlock(
		useDispatch( blockEditorStore )
	);

	const canEditTemplate = useSelect(
		( select ) =>
			!! select( coreStore ).canUser( 'create', {
				kind: 'postType',
				name: 'wp_template',
			} ),
		[]
	);

	const [ isDialogOpen, setIsDialogOpen ] = useState( false );

	useEffect( () => {
		const handleDblClick = ( event ) => {
			// If the editor is zoomed out, reset the zoom level and switch to
			// edit mode. The dialog will not be shown in this case.
			if ( isZoomOut ) {
				resetZoomLevel();
				__unstableSetEditorMode( 'edit' );
				return;
			}

			if ( ! canEditTemplate ) {
				return;
			}

			if (
				! event.target.classList.contains( 'is-root-container' ) ||
				event.target.dataset?.type === 'core/template-part'
			) {
				return;
			}
			setIsDialogOpen( true );
		};

		const canvas = contentRef.current;
		canvas?.addEventListener( 'dblclick', handleDblClick );
		return () => {
			canvas?.removeEventListener( 'dblclick', handleDblClick );
		};
	}, [
		contentRef,
		canEditTemplate,
		isZoomOut,
		resetZoomLevel,
		__unstableSetEditorMode,
	] );

	if ( ! canEditTemplate ) {
		return null;
	}

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
			size="medium"
		>
			{ __(
				'You’ve tried to select a block that is part of a template, which may be used on other posts and pages. Would you like to edit the template?'
			) }
		</ConfirmDialog>
	);
}
