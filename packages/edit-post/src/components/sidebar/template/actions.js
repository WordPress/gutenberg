/**
 * External dependencies
 */
import { kebabCase } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Button,
	Modal,
	TextControl,
	Flex,
	FlexItem,
	Tip,
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

function PostTemplateActions() {
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const [ title, setTitle ] = useState( '' );
	const { template, supportsTemplateMode } = useSelect( ( select ) => {
		const { getCurrentPostType } = select( editorStore );
		const { getPostType } = select( coreStore );
		const { getEditedPostTemplate } = select( editPostStore );

		const isViewable =
			getPostType( getCurrentPostType() )?.viewable ?? false;
		const _supportsTemplateMode =
			select( editorStore ).getEditorSettings().supportsTemplateMode &&
			isViewable;

		return {
			template: _supportsTemplateMode && getEditedPostTemplate(),
			supportsTemplateMode: _supportsTemplateMode,
		};
	}, [] );
	const { __unstableSwitchToTemplateMode } = useDispatch( editPostStore );

	if ( ! supportsTemplateMode ) {
		return null;
	}

	return (
		<>
			<div className="edit-post-template__actions">
				{ !! template && (
					<Button
						variant="link"
						onClick={ () => __unstableSwitchToTemplateMode() }
					>
						{ __( 'Edit' ) }
					</Button>
				) }
				<Button variant="link" onClick={ () => setIsModalOpen( true ) }>
					{ __( 'New' ) }
				</Button>
			</div>
			{ isModalOpen && (
				<Modal
					title={ __( 'Create a custom template' ) }
					closeLabel={ __( 'Close' ) }
					onRequestClose={ () => {
						setIsModalOpen( false );
						setTitle( '' );
					} }
					overlayClassName="edit-post-template__modal"
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
						<Flex align="flex-start" gap={ 8 }>
							<FlexItem>
								<div className="edit-post-template-modal__tip">
									<Tip>
										{ __(
											'A custom template can be applied to any post or page on your site.'
										) }
									</Tip>
								</div>
							</FlexItem>
							<FlexItem>
								<TextControl
									label={ __( 'Name' ) }
									value={ title }
									onChange={ setTitle }
									help={ __(
										'Give the template a name that describes its purpose, e.g. "Full Width". If you\'re unsure don\'t worry – the name can be changed later.'
									) }
								/>
							</FlexItem>
						</Flex>
						
						<Flex
							className="edit-post-template__modal-actions"
							justify="flex-end"
							expanded={ false }
						>
							<FlexItem>
								<Button
									variant="secondary"
									onClick={ () => {
										setIsModalOpen( false );
										setTitle( '' );
									} }
								>
									{ __( 'Cancel' ) }
								</Button>
							</FlexItem>
							<FlexItem>
								<Button variant="primary" type="submit">
									{ __( 'Create' ) }
								</Button>
							</FlexItem>
						</Flex>
					</form>
				</Modal>
			) }
		</>
	);
}

export default PostTemplateActions;
