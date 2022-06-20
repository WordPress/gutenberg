/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { __experimentalInspectorPopoverHeader as InspectorPopoverHeader } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { addCard } from '@wordpress/icons';
import { Notice, SelectControl, Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import PostTemplateCreateModal from './create-modal';

export default function PostTemplateForm( {
	isPostsPage,
	selectedOption,
	options,
	canCreate,
	canEdit,
	onChange,
	onEdit,
	onClose,
} ) {
	const [ isCreateModalOpen, setIsCreateModalOpen ] = useState( false );

	return (
		<>
			<InspectorPopoverHeader
				title={ __( 'Template' ) }
				help={ __(
					'Templates define the way your content is displayed when viewing your site.'
				) }
				actions={
					canCreate
						? [
								{
									icon: addCard,
									label: __( 'Add template' ),
									onClick: () => setIsCreateModalOpen( true ),
								},
						  ]
						: []
				}
				onClose={ onClose }
			/>
			{ isPostsPage ? (
				<Notice
					className="edit-post-post-template__notice"
					status="warning"
					isDismissible={ false }
				>
					{ __( 'The posts page template cannot be changed.' ) }
				</Notice>
			) : (
				<SelectControl
					hideLabelFromVision
					label={ __( 'Template' ) }
					value={ selectedOption?.value ?? '' }
					options={ options }
					onChange={ onChange }
				/>
			) }
			{ canEdit && (
				<p>
					<Button variant="link" onClick={ onEdit }>
						{ __( 'Edit template' ) }
					</Button>
				</p>
			) }
			{ isCreateModalOpen && (
				<PostTemplateCreateModal
					onClose={ () => setIsCreateModalOpen( false ) }
				/>
			) }
		</>
	);
}
