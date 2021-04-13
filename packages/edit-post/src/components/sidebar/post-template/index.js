/**
 * External dependencies
 */
import { kebabCase } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	PanelRow,
	Button,
	Modal,
	TextControl,
	Flex,
	FlexItem,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { store as editorStore } from '@wordpress/editor';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../../store';
import { createBlock, serialize } from '@wordpress/blocks';

function PostTemplate() {
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const [ title, setTitle ] = useState( '' );
	const { template, isEditing, supportsTemplateMode } = useSelect(
		( select ) => {
			const { getCurrentPostType } = select( editorStore );
			const { getPostType } = select( coreStore );
			const { isEditingTemplate, getEditedPostTemplate } = select(
				editPostStore
			);
			const _supportsTemplateMode = select(
				editorStore
			).getEditorSettings().supportsTemplateMode;
			const isViewable =
				getPostType( getCurrentPostType() )?.viewable ?? false;

			return {
				template:
					supportsTemplateMode &&
					isViewable &&
					getEditedPostTemplate(),
				isEditing: isEditingTemplate(),
				supportsTemplateMode: _supportsTemplateMode,
			};
		},
		[]
	);
	const { __unstableSwitchToTemplateMode } = useDispatch( editPostStore );

	if ( ! supportsTemplateMode ) {
		return null;
	}

	const templateTitle = (
		<>
			{ !! template && template?.title?.raw }
			{ !! template && ! template?.title?.raw && template.slug }
			{ ! template && __( 'Default' ) }
		</>
	);

	return (
		<PanelRow className="edit-post-post-template">
			<span>{ __( 'Template' ) }</span>
			{ ! isEditing && (
				<div className="edit-post-post-template__value">
					<div>{ templateTitle }</div>
					<div className="edit-post-post-template__actions">
						{ !! template && (
							<Button
								isLink
								onClick={ () =>
									__unstableSwitchToTemplateMode()
								}
							>
								{ __( 'Edit' ) }
							</Button>
						) }
						<Button isLink onClick={ () => setIsModalOpen( true ) }>
							{ __( 'New' ) }
						</Button>
					</div>
				</div>
			) }
			{ isEditing && (
				<span className="edit-post-post-template__value">
					{ templateTitle }
				</span>
			) }
			{ isModalOpen && (
				<Modal
					title={ __( 'Create a custom template' ) }
					closeLabel={ __( 'Close' ) }
					onRequestClose={ () => {
						setIsModalOpen( false );
						setTitle( '' );
					} }
					overlayClassName="edit-post-post-template__modal"
				>
					<form
						onSubmit={ ( event ) => {
							event.preventDefault();
							const defaultTitle = __( 'Custom Template' );
							const templateContent = [
								createBlock( 'core/site-title' ),
								createBlock( 'core/site-tagline' ),
								createBlock( 'core/separator' ),
								createBlock( 'core/post-title' ),
								createBlock( 'core/post-content' ),
							];
							__unstableSwitchToTemplateMode( {
								slug:
									'wp-custom-template-' +
									kebabCase( title ?? defaultTitle ),
								content: serialize( templateContent ),
								title: title ?? defaultTitle,
							} );
							setIsModalOpen( false );
						} }
					>
						<TextControl
							label={ __( 'Name' ) }
							value={ title }
							onChange={ setTitle }
						/>
						<Flex
							className="edit-post-post-template__modal-actions"
							justify="flex-end"
						>
							<FlexItem>
								<Button
									isSecondary
									onClick={ () => {
										setIsModalOpen( false );
										setTitle( '' );
									} }
								>
									{ __( 'Cancel' ) }
								</Button>
							</FlexItem>
							<FlexItem>
								<Button isPrimary type="submit">
									{ __( 'Create' ) }
								</Button>
							</FlexItem>
						</Flex>
					</form>
				</Modal>
			) }
		</PanelRow>
	);
}

export default PostTemplate;
