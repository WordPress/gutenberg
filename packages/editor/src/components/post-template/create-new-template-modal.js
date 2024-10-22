/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { serialize, createBlock } from '@wordpress/blocks';
import {
	Modal,
	TextControl,
	Button,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { cleanForSlug } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { store as editorStore } from '../../store';

const DEFAULT_TITLE = __( 'Custom Template' );

export default function CreateNewTemplateModal( { onClose } ) {
	const { defaultBlockTemplate, onNavigateToEntityRecord } = useSelect(
		( select ) => {
			const { getEditorSettings, getCurrentTemplateId } =
				select( editorStore );
			return {
				defaultBlockTemplate: getEditorSettings().defaultBlockTemplate,
				onNavigateToEntityRecord:
					getEditorSettings().onNavigateToEntityRecord,
				getTemplateId: getCurrentTemplateId,
			};
		}
	);

	const { createTemplate } = unlock( useDispatch( editorStore ) );

	const [ title, setTitle ] = useState( '' );

	const [ isBusy, setIsBusy ] = useState( false );

	const cancel = () => {
		setTitle( '' );
		onClose();
	};

	const submit = async ( event ) => {
		event.preventDefault();

		if ( isBusy ) {
			return;
		}

		setIsBusy( true );

		const newTemplateContent =
			defaultBlockTemplate ??
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

		const newTemplate = await createTemplate( {
			slug: cleanForSlug( title || DEFAULT_TITLE ),
			content: newTemplateContent,
			title: title || DEFAULT_TITLE,
		} );

		setIsBusy( false );
		onNavigateToEntityRecord( {
			postId: newTemplate.id,
			postType: 'wp_template',
		} );
		cancel();
	};

	return (
		<Modal
			title={ __( 'Create custom template' ) }
			onRequestClose={ cancel }
			focusOnMount="firstContentElement"
			size="small"
		>
			<form
				className="editor-post-template__create-form"
				onSubmit={ submit }
			>
				<VStack spacing="3">
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Name' ) }
						value={ title }
						onChange={ setTitle }
						placeholder={ DEFAULT_TITLE }
						disabled={ isBusy }
						help={ __(
							'Describe the template, e.g. "Post with sidebar". A custom template can be manually applied to any post or page.'
						) }
					/>
					<HStack justify="right">
						<Button
							__next40pxDefaultSize
							variant="tertiary"
							onClick={ cancel }
						>
							{ __( 'Cancel' ) }
						</Button>

						<Button
							__next40pxDefaultSize
							variant="primary"
							type="submit"
							isBusy={ isBusy }
							aria-disabled={ isBusy }
						>
							{ __( 'Create' ) }
						</Button>
					</HStack>
				</VStack>
			</form>
		</Modal>
	);
}
