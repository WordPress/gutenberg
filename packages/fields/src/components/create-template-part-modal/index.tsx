/**
 * WordPress dependencies
 */
import {
	Icon,
	BaseControl,
	TextControl,
	Button,
	Modal,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import type { TemplatePartArea } from '@wordpress/core-data';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	check,
	footer as footerIcon,
	header as headerIcon,
	sidebar as sidebarIcon,
	tableColumnAfter as overlayIcon,
	symbolFilled as symbolFilledIcon,
} from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
// @ts-expect-error serialize is not typed
import { serialize } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import {
	getCleanTemplatePartSlug,
	getUniqueTemplatePartTitle,
	useExistingTemplateParts,
} from './utils';

function getAreaRadioId( value: string, instanceId: number ) {
	return `fields-create-template-part-modal__area-option-${ value }-${ instanceId }`;
}
function getAreaRadioDescriptionId( value: string, instanceId: number ) {
	return `fields-create-template-part-modal__area-option-description-${ value }-${ instanceId }`;
}

type CreateTemplatePartModalContentsProps = {
	defaultArea?: string;
	blocks: any[];
	confirmLabel?: string;
	closeModal: () => void;
	onCreate: ( templatePart: any ) => void;
	onError?: () => void;
	defaultTitle?: string;
};

/**
 * A React component that renders a modal for creating a template part. The modal displays a title and the contents for creating the template part.
 * This component should not live in this package, it should be moved to a dedicated package responsible for managing template.
 * @param props            The component props.
 * @param props.modalTitle
 */
export default function CreateTemplatePartModal( {
	modalTitle,
	...restProps
}: {
	modalTitle?: string;
} & CreateTemplatePartModalContentsProps ) {
	const defaultModalTitle = useSelect(
		( select ) =>
			select( coreStore ).getPostType( 'wp_template_part' )?.labels
				?.add_new_item,
		[]
	);
	return (
		<Modal
			title={ modalTitle || defaultModalTitle }
			onRequestClose={ restProps.closeModal }
			overlayClassName="fields-create-template-part-modal"
			focusOnMount="firstContentElement"
			size="medium"
		>
			<CreateTemplatePartModalContents { ...restProps } />
		</Modal>
	);
}

/**
 * Helper function to retrieve the corresponding icon by area name or icon name.
 *
 * @param {string} areaOrIconName The area name (e.g., 'header', 'overlay') or icon name (e.g., 'menu').
 *
 * @return {Object} The corresponding icon.
 */
const getTemplatePartIcon = ( areaOrIconName: string ) => {
	// Handle area names first
	if ( 'header' === areaOrIconName ) {
		return headerIcon;
	} else if ( 'footer' === areaOrIconName ) {
		return footerIcon;
	} else if ( 'sidebar' === areaOrIconName ) {
		return sidebarIcon;
	} else if ( 'overlay' === areaOrIconName ) {
		// TODO: Replace with a proper overlay icon when available.
		// Using tableColumnAfter as a placeholder.
		return overlayIcon;
	}
	// Handle icon names for backwards compatibility
	if ( 'menu' === areaOrIconName ) {
		// TODO: Replace with a proper overlay icon when available.
		// Using tableColumnAfter as a placeholder.
		return overlayIcon;
	}
	return symbolFilledIcon;
};

/**
 * A React component that renders the content of a model for creating a template part.
 * This component should not live in this package; it should be moved to a dedicated package responsible for managing template.
 *
 * @param {Object}   props                             - The component props.
 * @param {string}   [props.defaultArea=uncategorized] - The default area for the template part.
 * @param {Array}    [props.blocks=[]]                 - The blocks to be included in the template part.
 * @param {string}   [props.confirmLabel='Add']        - The label for the confirm button.
 * @param {Function} props.closeModal                  - Function to close the modal.
 * @param {Function} props.onCreate                    - Function to call when the template part is successfully created.
 * @param {Function} [props.onError]                   - Function to call when there is an error creating the template part.
 * @param {string}   [props.defaultTitle='']           - The default title for the template part.
 */
export function CreateTemplatePartModalContents( {
	defaultArea = 'uncategorized',
	blocks = [],
	confirmLabel = __( 'Add' ),
	closeModal,
	onCreate,
	onError,
	defaultTitle = '',
}: CreateTemplatePartModalContentsProps ) {
	const { createErrorNotice } = useDispatch( noticesStore );
	const { saveEntityRecord } = useDispatch( coreStore );
	const existingTemplateParts = useExistingTemplateParts();

	const [ title, setTitle ] = useState( defaultTitle );
	const [ area, setArea ] = useState( defaultArea );
	const [ isSubmitting, setIsSubmitting ] = useState( false );
	const instanceId = useInstanceId( CreateTemplatePartModal );

	const defaultTemplatePartAreas = useSelect(
		( select ) =>
			select( coreStore ).getCurrentTheme()?.default_template_part_areas,
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
				error instanceof Error &&
				'code' in error &&
				error.message &&
				error.code !== 'unknown_error'
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
				<fieldset className="fields-create-template-part-modal__area-fieldset">
					<BaseControl.VisualLabel as="legend">
						{ __( 'Area' ) }
					</BaseControl.VisualLabel>
					<div className="fields-create-template-part-modal__area-radio-group">
						{ ( defaultTemplatePartAreas ?? [] ).map(
							( item: TemplatePartArea ) => {
								const icon = getTemplatePartIcon( item.icon );
								return (
									<div
										key={ item.area }
										className="fields-create-template-part-modal__area-radio-wrapper"
									>
										<input
											type="radio"
											id={ getAreaRadioId(
												item.area,
												instanceId
											) }
											name={ `fields-create-template-part-modal__area-${ instanceId }` }
											value={ item.area }
											checked={ area === item.area }
											onChange={ () => {
												setArea( item.area );
											} }
											aria-describedby={ getAreaRadioDescriptionId(
												item.area,
												instanceId
											) }
										/>
										<Icon
											icon={ icon }
											className="fields-create-template-part-modal__area-radio-icon"
										/>
										<label
											htmlFor={ getAreaRadioId(
												item.area,
												instanceId
											) }
											className="fields-create-template-part-modal__area-radio-label"
										>
											{ item.label }
										</label>
										<Icon
											icon={ check }
											className="fields-create-template-part-modal__area-radio-checkmark"
										/>
										<p
											className="fields-create-template-part-modal__area-radio-description"
											id={ getAreaRadioDescriptionId(
												item.area,
												instanceId
											) }
										>
											{ item.description }
										</p>
									</div>
								);
							}
						) }
					</div>
				</fieldset>
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
