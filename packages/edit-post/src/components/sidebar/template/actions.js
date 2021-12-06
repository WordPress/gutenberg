/**
 * External dependencies
 */
import { kebabCase } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
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
	const [ isBusy, setIsBusy ] = useState( false );
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
	const {
		__unstableCreateTemplate,
		__unstableSwitchToTemplateMode,
	} = useDispatch( editPostStore );

	if ( ! supportsTemplateMode ) {
		return null;
	}

	const defaultTitle = __( 'Custom Template' );

	async function onCreateTemplate( event ) {
		event.preventDefault();

		if ( isBusy ) {
			return;
		}

		setIsBusy( true );

		const newTemplateContent =
			defaultTemplate ??
			serialize( [
				createBlock(
					'core/group',
					{
						tagName: 'header',
						layout: { inherit: true },
					},
					[
						createBlock( 'core/site-title' ),
						createBlock( 'core/site-tagline' ),
					]
				),
				createBlock( 'core/separator' ),
				createBlock(
					'core/group',
					{
						tagName: 'main',
					},
					[
						createBlock(
							'core/group',
							{
								layout: { inherit: true },
							},
							[ createBlock( 'core/post-title' ) ]
						),
						createBlock( 'core/post-content', {
							layout: { inherit: true },
						} ),
					]
				),
			] );

		await __unstableCreateTemplate( {
			slug: 'wp-custom-template-' + kebabCase( title || defaultTitle ),
			content: newTemplateContent,
			title: title || defaultTitle,
		} );

		setIsBusy( false );
		setIsModalOpen( false );

		__unstableSwitchToTemplateMode( true );
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
					{
						/* translators: button to create a new template */
						_x( 'New', 'action' )
					}
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
					<form onSubmit={ onCreateTemplate }>
						<Flex align="flex-start" gap={ 8 }>
							<FlexItem>
								<TextControl
									label={ __( 'Name' ) }
									value={ title }
									onChange={ setTitle }
									placeholder={ defaultTitle }
									disabled={ isBusy }
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
								<Button
									variant="primary"
									type="submit"
									isBusy={ isBusy }
									aria-disabled={ isBusy }
								>
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
