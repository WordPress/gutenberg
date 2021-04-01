/**
 * External dependencies
 */
import { kebabCase } from 'lodash';
import classnames from 'classnames';

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
	__unstableComposite as Composite,
	__unstableCompositeItem as CompositeItem,
	__unstableUseCompositeState as useCompositeState,
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
	const composite = useCompositeState();

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
									<Composite
										className="edit-site-template-part-converter__area-composite"
										role="group"
										id={ `edit-site-template-part-converter__area-selection-${ instanceId }` }
										aria-label={ __( 'Area' ) }
										{ ...composite }
									>
										{ templatePartAreas.map(
											( {
												icon,
												label,
												area: value,
												description,
											} ) => (
												<CompositeItem
													role="radio"
													as={ Button }
													key={ label }
													onClick={ () =>
														setArea( value )
													}
													className={ classnames(
														'edit-site-template-part-converter__area-button',
														{
															'is-selected':
																area === value,
														}
													) }
													aria-checked={
														area === value
													}
													{ ...composite }
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
														<FlexBlock>
															{ label }
															<div>
																{ description }
															</div>
														</FlexBlock>
														{ area === value && (
															<FlexItem>
																<Icon
																	icon={
																		check
																	}
																/>
															</FlexItem>
														) }
													</Flex>
												</CompositeItem>
											)
										) }
									</Composite>
								</BaseControl>
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
