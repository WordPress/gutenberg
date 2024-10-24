/**
 * WordPress dependencies
 */
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
import { useInstanceId } from '@wordpress/compose';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	check,
	footer as footerIcon,
	header as headerIcon,
	sidebar as sidebarIcon,
	symbolFilled as symbolFilledIcon,
} from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
// @ts-ignore
import { store as blockEditorStore } from '@wordpress/block-editor';
// @ts-ignore
import { serialize } from '@wordpress/blocks';

/**
 * Internal dependencies
 */

import {
	getCleanTemplatePartSlug,
	getUniqueTemplatePartTitle,
	useExistingTemplateParts,
} from './utils';

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
 * @param {Object} props            The component props.
 * @param          props.modalTitle
 */
export function CreateTemplatePartModal( {
	modalTitle,
	...restProps
}: {
	modalTitle: string;
} & CreateTemplatePartModalContentsProps ) {
	const defaultModalTitle = useSelect(
		( select ) =>
			// @ts-ignore
			select( coreStore ).getPostType( 'wp_template_part' )?.labels
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
			{ /* @ts-ignore */ }
			<CreateTemplatePartModalContents { ...restProps } />
		</Modal>
	);
}

const getTemplatePartIcon = ( iconName: string ) => {
	if ( 'header' === iconName ) {
		return headerIcon;
	} else if ( 'footer' === iconName ) {
		return footerIcon;
	} else if ( 'sidebar' === iconName ) {
		return sidebarIcon;
	}
	return symbolFilledIcon;
};

const getDefaultTemplatePartAreas = (
	settings: Record< string, any > & {
		defaultTemplatePartAreas?: Array< {
			icon: string;
			label: string;
			area: string;
			description: string;
		} >;
	}
) => {
	const areas = settings.defaultTemplatePartAreas ?? [];
	return areas.map( ( item ) => {
		return { ...item, icon: getTemplatePartIcon( item.icon ) };
	} );
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

	const settings = useSelect(
		// @ts-ignore
		( select ) => select( blockEditorStore ).getSettings(),
		[]
	);

	const defaultTemplatePartAreas = getDefaultTemplatePartAreas( settings );

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
						onChange={ ( value ) =>
							value && typeof value === 'string'
								? setArea( value )
								: () => void 0
						}
						checked={ area }
					>
						{ defaultTemplatePartAreas.map(
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
