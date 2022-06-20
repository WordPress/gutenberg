/**
 * External dependencies
 */
import { kebabCase } from 'lodash';

/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useState } from '@wordpress/element';
import { serialize, createBlock } from '@wordpress/blocks';
import {
	Modal,
	Flex,
	FlexItem,
	TextControl,
	Button,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../../store';

const DEFAULT_TITLE = __( 'Custom Template' );

export default function PostTemplateCreateModal( { onClose } ) {
	const settings = useSelect(
		( select ) => select( editorStore ).getEditorSettings(),
		[]
	);

	const { __unstableCreateTemplate, __unstableSwitchToTemplateMode } =
		useDispatch( editPostStore );

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
			settings.defaultBlockTemplate ??
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
			slug: 'wp-custom-template-' + kebabCase( title || DEFAULT_TITLE ),
			content: newTemplateContent,
			title: title || DEFAULT_TITLE,
		} );

		setIsBusy( false );
		cancel();

		__unstableSwitchToTemplateMode( true );
	};

	return (
		<Modal
			title={ __( 'Create custom template' ) }
			closeLabel={ __( 'Close' ) }
			onRequestClose={ cancel }
			overlayClassName="edit-post-post-template__modal"
		>
			<form onSubmit={ submit }>
				<Flex align="flex-start" gap={ 8 }>
					<FlexItem>
						<TextControl
							label={ __( 'Name' ) }
							value={ title }
							onChange={ setTitle }
							placeholder={ DEFAULT_TITLE }
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
						<Button variant="tertiary" onClick={ cancel }>
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
	);
}
