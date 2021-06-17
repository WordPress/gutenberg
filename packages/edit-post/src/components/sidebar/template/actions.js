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
	const { template, supportsTemplateMode, defaultTemplate } = useSelect(
		( select ) => {
			const { getCurrentPostType, getEditorSettings } = select(
				editorStore
			);
			const { getPostType } = select( coreStore );
			const { getEditedPostTemplate } = select( editPostStore );

			const isViewable =
				getPostType( getCurrentPostType() )?.viewable ?? false;
			const _supportsTemplateMode =
				getEditorSettings().supportsTemplateMode && isViewable;

			return {
				template: _supportsTemplateMode && getEditedPostTemplate(),
				supportsTemplateMode: _supportsTemplateMode,
				defaultTemplate: getEditorSettings().defaultBlockTemplate,
			};
		},
		[]
	);
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
					title={ __( 'Create custom template' ) }
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
							const newTemplateContent =
								defaultTemplate ??
								serialize( [
									createBlock( 'core/site-title' ),
									createBlock( 'core/site-tagline' ),
									createBlock( 'core/separator' ),
									createBlock( 'core/post-title' ),
									createBlock( 'core/post-content', {
										layout: { inherit: true },
									} ),
								] );

							__unstableSwitchToTemplateMode( {
								slug:
									'wp-custom-template-' +
									kebabCase( title ?? defaultTitle ),
								content: newTemplateContent,
								title: title ?? defaultTitle,
							} );
							setIsModalOpen( false );
						} }
					>
						<Flex align="flex-start" gap={ 8 }>
							<FlexItem>
								<TextControl
									label={ __( 'Name' ) }
									value={ title }
									onChange={ setTitle }
									help={ __(
										'Describe the purpose of the template, e.g. "Full Width". Custom templates can be applied to any post or page.'
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
									variant="tertiary"
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
