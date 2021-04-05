/**
 * External dependencies
 */
import { kebabCase } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	PanelRow,
	Button,
	Modal,
	TextControl,
	Flex,
	FlexItem,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { createInterpolateElement, useState } from '@wordpress/element';
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

	return (
		<PanelRow className="edit-post-post-template">
			<span>{ __( 'Template' ) }</span>
			{ ! isEditing && (
				<span className="edit-post-post-template__value">
					{ !! template &&
						createInterpolateElement(
							sprintf(
								/* translators: 1: Template name. */
								__( '%s (<a>Edit</a>)' ),
								template.slug
							),
							{
								a: (
									<Button
										isLink
										onClick={ () =>
											__unstableSwitchToTemplateMode()
										}
									>
										{ __( 'Edit' ) }
									</Button>
								),
							}
						) }
					{ ! template &&
						createInterpolateElement(
							__( 'Default (<create />)' ),
							{
								create: (
									<Button
										isLink
										onClick={ () => setIsModalOpen( true ) }
									>
										{ __( 'Create custom template' ) }
									</Button>
								),
							}
						) }
				</span>
			) }
			{ isEditing && (
				<span className="edit-post-post-template__value">
					{ template?.slug }
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
				>
					<form
						onSubmit={ ( event ) => {
							event.preventDefault();
							const defaultTitle = __( 'Custom Template' );
							const templateContent = [
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
