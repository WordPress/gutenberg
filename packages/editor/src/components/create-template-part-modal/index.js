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
import { store as noticesStore } from '@wordpress/notices';
import { store as coreStore } from '@wordpress/core-data';
import { check } from '@wordpress/icons';
import { serialize } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import {
	TEMPLATE_PART_POST_TYPE,
	TEMPLATE_PART_AREA_DEFAULT_CATEGORY,
} from '../../store/constants';
import {
	useExistingTemplateParts,
	getUniqueTemplatePartTitle,
	getCleanTemplatePartSlug,
} from './utils';

export default function CreateTemplatePartModal( {
	modalTitle,
	...restProps
} ) {
	const defaultModalTitle = useSelect(
		( select ) =>
			select( coreStore ).getPostType( TEMPLATE_PART_POST_TYPE )?.labels
				?.add_new_item,
		[]
	);
	return (
		<Modal
			title={ modalTitle || defaultModalTitle }
			onRequestClose={ restProps.closeModal }
			overlayClassName="editor-create-template-part-modal"
			focusOnMount="firstContentElement"
			size="medium"
		>
			<CreateTemplatePartModalContents { ...restProps } />
		</Modal>
	);
}

export function CreateTemplatePartModalContents( {
	defaultArea = TEMPLATE_PART_AREA_DEFAULT_CATEGORY,
	blocks = [],
	confirmLabel = __( 'Add' ),
	closeModal,
	onCreate,
	onError,
	defaultTitle = '',
} ) {
	const { createErrorNotice } = useDispatch( noticesStore );
	const { saveEntityRecord } = useDispatch( coreStore );
	const existingTemplateParts = useExistingTemplateParts();

	const [ title, setTitle ] = useState( defaultTitle );
	const [ area, setArea ] = useState( defaultArea );
	const [ isSubmitting, setIsSubmitting ] = useState( false );
	const instanceId = useInstanceId( CreateTemplatePartModal );

	const templatePartAreas = useSelect(
		( select ) =>
			select( editorStore ).__experimentalGetDefaultTemplatePartAreas(),
		[]
	);
	async function createTemplatePart() {
		if ( ! title || isSubmitting ) {
			return;
		}

		try {
			setIsSubmitting( true );
			const uniqueTitle = getUniqueTemplatePartTitle(
				title,
				existingTemplateParts
			);
			const cleanSlug = getCleanTemplatePartSlug( uniqueTitle );

			const templatePart = await saveEntityRecord(
				'postType',
				TEMPLATE_PART_POST_TYPE,
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
		} finally {
			setIsSubmitting( false );
		}
	}
	return (
		<form
			onSubmit={ async ( event ) => {
				event.preventDefault();
				await createTemplatePart();
			} }
		>
			<VStack spacing="4">
				<TextControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					label={ __( 'Name' ) }
					value={ title }
					onChange={ setTitle }
					required
				/>
				<BaseControl
					__nextHasNoMarginBottom
					label={ __( 'Area' ) }
					id={ `editor-create-template-part-modal__area-selection-${ instanceId }` }
					className="editor-create-template-part-modal__area-base-control"
				>
					<RadioGroup
						label={ __( 'Area' ) }
						className="editor-create-template-part-modal__area-radio-group"
						id={ `editor-create-template-part-modal__area-selection-${ instanceId }` }
						onChange={ setArea }
						checked={ area }
					>
						{ templatePartAreas.map(
							( { icon, label, area: value, description } ) => (
								<Radio
									key={ label }
									value={ value }
									className="editor-create-template-part-modal__area-radio"
								>
									<Flex align="start" justify="start">
										<FlexItem>
											<Icon icon={ icon } />
										</FlexItem>
										<FlexBlock className="editor-create-template-part-modal__option-label">
											{ label }
											<div>{ description }</div>
										</FlexBlock>

										<FlexItem className="editor-create-template-part-modal__checkbox">
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
						__next40pxDefaultSize
						variant="tertiary"
						onClick={ () => {
							closeModal();
						} }
					>
						{ __( 'Cancel' ) }
					</Button>
					<Button
						__next40pxDefaultSize
						variant="primary"
						type="submit"
						aria-disabled={ ! title || isSubmitting }
						isBusy={ isSubmitting }
					>
						{ confirmLabel }
					</Button>
				</HStack>
			</VStack>
		</form>
	);
}
