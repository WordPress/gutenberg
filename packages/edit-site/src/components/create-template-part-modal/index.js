/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import {
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
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { useInstanceId } from '@wordpress/compose';
import { store as editorStore } from '@wordpress/editor';
import { store as noticesStore } from '@wordpress/notices';
import { store as coreStore } from '@wordpress/core-data';
import { check } from '@wordpress/icons';
import { serialize } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { TEMPLATE_PART_AREA_GENERAL } from '../../store/constants';
import {
	useExistingTemplateParts,
	getUniqueTemplatePartTitle,
	getCleanTemplatePartSlug,
} from '../../utils/template-part-create';

export default function CreateTemplatePartModal( {
	closeModal,
	blocks = [],
	onCreate,
	onError,
} ) {
	const { createErrorNotice } = useDispatch( noticesStore );
	const { saveEntityRecord } = useDispatch( coreStore );
	const existingTemplateParts = useExistingTemplateParts();

	const [ title, setTitle ] = useState( '' );
	const [ area, setArea ] = useState( TEMPLATE_PART_AREA_GENERAL );
	const [ isSubmitting, setIsSubmitting ] = useState( false );
	const instanceId = useInstanceId( CreateTemplatePartModal );

	const templatePartAreas = useSelect(
		( select ) =>
			select( editorStore ).__experimentalGetDefaultTemplatePartAreas(),
		[]
	);

	async function createTemplatePart() {
		if ( ! title ) {
			createErrorNotice( __( 'Please enter a title.' ), {
				type: 'snackbar',
			} );
			return;
		}

		try {
			const uniqueTitle = getUniqueTemplatePartTitle(
				title,
				existingTemplateParts
			);
			const cleanSlug = getCleanTemplatePartSlug( uniqueTitle );

			const templatePart = await saveEntityRecord(
				'postType',
				'wp_template_part',
				{
					slug: cleanSlug,
					title: uniqueTitle,
					content: serialize( blocks ),
					area,
				},
				{ throwOnError: true }
			);
			await onCreate( templatePart );

			// TODO: Add a success notice?
		} catch ( error ) {
			const errorMessage =
				error.message && error.code !== 'unknown_error'
					? error.message
					: __(
							'An error occurred while creating the template part.'
					  );

			createErrorNotice( errorMessage, { type: 'snackbar' } );

			onError?.();
		}
	}

	return (
		<Modal
			title={ __( 'Create a template part' ) }
			onRequestClose={ closeModal }
			overlayClassName="edit-site-create-template-part-modal"
		>
			<form
				onSubmit={ async ( event ) => {
					event.preventDefault();
					if ( ! title ) {
						return;
					}
					setIsSubmitting( true );
					await createTemplatePart();
				} }
			>
				<VStack spacing="4">
					<TextControl
						__nextHasNoMarginBottom
						label={ __( 'Name' ) }
						value={ title }
						onChange={ setTitle }
						required
					/>
					<BaseControl
						label={ __( 'Area' ) }
						id={ `edit-site-create-template-part-modal__area-selection-${ instanceId }` }
						className="edit-site-create-template-part-modal__area-base-control"
					>
						<RadioGroup
							label={ __( 'Area' ) }
							className="edit-site-create-template-part-modal__area-radio-group"
							id={ `edit-site-create-template-part-modal__area-selection-${ instanceId }` }
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
										className="edit-site-create-template-part-modal__area-radio"
									>
										<Flex align="start" justify="start">
											<FlexItem>
												<Icon icon={ icon } />
											</FlexItem>
											<FlexBlock className="edit-site-create-template-part-modal__option-label">
												{ label }
												<div>{ description }</div>
											</FlexBlock>

											<FlexItem className="edit-site-create-template-part-modal__checkbox">
												{ area === value && (
													<Icon icon={ check } />
												) }
											</FlexItem>
										</Flex>
									</Radio>
								)
							) }
						</RadioGroup>
					</BaseControl>
					<HStack justify="right">
						<Button
							variant="tertiary"
							onClick={ () => {
								closeModal();
							} }
						>
							{ __( 'Cancel' ) }
						</Button>
						<Button
							variant="primary"
							type="submit"
							disabled={ ! title }
							isBusy={ isSubmitting }
						>
							{ __( 'Create' ) }
						</Button>
					</HStack>
				</VStack>
			</form>
		</Modal>
	);
}
