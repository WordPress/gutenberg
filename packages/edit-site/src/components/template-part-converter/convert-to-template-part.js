/**
 * External dependencies
 */
import { kebabCase } from 'lodash';

/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import {
	BlockSettingsMenuControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import {
	MenuItem,
	Icon,
	BaseControl,
	TextControl,
	Flex,
	FlexItem,
	FlexBlock,
	Button,
	Modal,
	__experimentalRadioGroup as RadioGroup,
	__experimentalRadio as Radio,
} from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { createBlock, serialize } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
import { store as editorStore } from '@wordpress/editor';
import { check } from '@wordpress/icons';

export default function ConvertToTemplatePart( { clientIds, blocks } ) {
	const instanceId = useInstanceId( ConvertToTemplatePart );
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const [ title, setTitle ] = useState( '' );
	const { replaceBlocks } = useDispatch( blockEditorStore );
	const { saveEntityRecord } = useDispatch( coreStore );
	const { createSuccessNotice } = useDispatch( noticesStore );
	const [ area, setArea ] = useState( 'uncategorized' );

	const templatePartAreas = useSelect(
		( select ) =>
			select( editorStore ).__experimentalGetDefaultTemplatePartAreas(),
		[]
	);

	const onConvert = async ( templatePartTitle ) => {
		const defaultTitle = __( 'Untitled Template Part' );
		const templatePart = await saveEntityRecord(
			'postType',
			'wp_template_part',
			{
				slug: kebabCase( templatePartTitle || defaultTitle ),
				title: templatePartTitle || defaultTitle,
				content: serialize( blocks ),
				area,
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
								<BaseControl
									label={ __( 'Area' ) }
									id={ `edit-site-template-part-converter__area-selection-${ instanceId }` }
									className="edit-site-template-part-converter__area-base-control"
								>
									<RadioGroup
										label={ __( 'Area' ) }
										className="edit-site-template-part-converter__area-radio-group"
										id={ `edit-site-template-part-converter__area-selection-${ instanceId }` }
										onChange={ setArea }
										checked={ area }
									>
										{ templatePartAreas.map(
											( {
												icon,
												label,
												area: value,
												description,
											} ) => (
												<Radio
													key={ label }
													value={ value }
													className="edit-site-template-part-converter__area-radio"
												>
													<Flex
														align="start"
														justify="start"
													>
														<FlexItem>
															<Icon
																icon={ icon }
															/>
														</FlexItem>
														<FlexBlock className="edit-site-template-part-converter__option-label">
															{ label }
															<div>
																{ description }
															</div>
														</FlexBlock>

														<FlexItem className="edit-site-template-part-converter__checkbox">
															{ area ===
																value && (
																<Icon
																	icon={
																		check
																	}
																/>
															) }
														</FlexItem>
													</Flex>
												</Radio>
											)
										) }
									</RadioGroup>
								</BaseControl>
								<Flex
									className="edit-site-template-part-converter__convert-modal-actions"
									justify="flex-end"
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
			) }
		</BlockSettingsMenuControls>
	);
}
