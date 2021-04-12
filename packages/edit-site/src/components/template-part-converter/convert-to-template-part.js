/**
 * External dependencies
 */
import { kebabCase } from 'lodash';

/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import {
	BlockSettingsMenuControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import {
	MenuItem,
	TextControl,
	Flex,
	FlexItem,
	Button,
	Modal,
} from '@wordpress/components';
import { createBlock, serialize } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';

export default function ConvertToTemplatePart( { clientIds, blocks } ) {
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const [ title, setTitle ] = useState( '' );
	const { replaceBlocks } = useDispatch( blockEditorStore );
	const { saveEntityRecord } = useDispatch( coreStore );
	const { createSuccessNotice } = useDispatch( noticesStore );

	const onConvert = async ( templatePartTitle ) => {
		const defaultTitle = __( 'Untitled Template Part' );
		const templatePart = await saveEntityRecord(
			'postType',
			'wp_template_part',
			{
				slug: kebabCase( templatePartTitle || defaultTitle ),
				title: templatePartTitle || defaultTitle,
				content: serialize( blocks ),
			}
		);
		replaceBlocks(
			clientIds,
			createBlock( 'core/template-part', {
				slug: templatePart.slug,
				theme: templatePart.theme,
			} )
		);
		createSuccessNotice( __( 'Template part created.' ), {
			type: 'snackbar',
		} );
	};

	return (
		<BlockSettingsMenuControls>
			{ ( { onClose } ) => (
				<>
					<MenuItem
						onClick={ () => {
							setIsModalOpen( true );
						} }
					>
						{ __( 'Make template part' ) }
					</MenuItem>
					{ isModalOpen && (
						<Modal
							title={ __( 'Create a template part' ) }
							closeLabel={ __( 'Close' ) }
							onRequestClose={ () => {
								setIsModalOpen( false );
								setTitle( '' );
							} }
							overlayClassName="edit-site-template-part-converter__modal"
						>
							<form
								onSubmit={ ( event ) => {
									event.preventDefault();
									onConvert( title );
									setIsModalOpen( false );
									setTitle( '' );
									onClose();
								} }
							>
								<TextControl
									label={ __( 'Name' ) }
									value={ title }
									onChange={ setTitle }
								/>
								<Flex
									className="edit-site-template-part-converter__convert-modal-actions"
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
				</>
			) }
		</BlockSettingsMenuControls>
	);
}
