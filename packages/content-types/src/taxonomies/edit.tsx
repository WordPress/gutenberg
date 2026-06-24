/**
 * WordPress dependencies
 */
import { Breadcrumbs, Page } from '@wordpress/admin-ui';
import { Button } from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	DataForm,
	useFormValidity,
	type Field,
	type Form,
} from '@wordpress/dataviews';
import { useMemo, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { useNavigate, useParams } from '@wordpress/route';
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import {
	addNewItemLabelField,
	addOrRemoveItemsField,
	advancedFormFields,
	allItemsField,
	backToItemsField,
	chooseFromMostUsedField,
	defaultTermEnabledField,
	defaultTermNameField,
	descriptionField,
	editItemField,
	generalFormFields,
	hierarchicalField,
	labelsActionsField,
	labelsFormFields,
	menuNameField,
	newItemNameField,
	notFoundField,
	parentItemColonField,
	parentItemField,
	popularItemsField,
	publicField,
	publiclyQueryableField,
	searchItemsField,
	separateItemsField,
	showAdminColumnField,
	showInMenuField,
	showInNavMenusField,
	showInQuickEditField,
	showInRestField,
	showTagcloudField,
	showUiField,
	sortField,
	updateItemField,
	useObjectTypeField,
	useSlugField,
	viewItemField,
	visibilityFormFields,
} from './fields';
import {
	pluralLabelField,
	singularLabelField,
	statusField,
} from '../utils/fields';
import type { TaxonomyFormData, TaxonomyRecord } from './types';
import { BLANK_RECORD, serializeForSave, toFormData } from './utils';
import { useMaybeInvalidateContentTypeCache } from '../utils/use-maybe-invalidate-content-type-cache';
import {
	NEW_ID,
	POST_TYPE_ENTITY,
	TAXONOMIES_PATH,
	TAXONOMY_ENTITY,
} from '../constants';

type TaxonomyPageProps = {
	isAddMode: boolean;
	initialData: TaxonomyFormData;
	title: string;
	breadcrumbLabel: string;
	subTitle: string;
	onSaved?: ( saved: TaxonomyFormData & { id: number } ) => void;
};

export function TaxonomyEdit() {
	const { id } = useParams( { from: `${ TAXONOMIES_PATH }/$id` } );
	const navigate = useNavigate();
	const isAddMode = id === NEW_ID;
	const taxonomyId = parseInt( id, 10 );
	const record = useSelect(
		( select ) => {
			return (
				! isAddMode &&
				// beforeLoad (route.ts) guarantees the record is in cache.
				select( coreStore ).getEntityRecord< TaxonomyRecord >(
					'postType',
					TAXONOMY_ENTITY,
					taxonomyId
				)!
			);
		},
		[ isAddMode, taxonomyId ]
	);
	const initialData =
		! isAddMode && record ? toFormData( record ) : BLANK_RECORD;
	const title = isAddMode ? __( 'Add taxonomy' ) : initialData.title.raw;
	const commonProps = { initialData, title };
	const taxonomyPageProps: TaxonomyPageProps = isAddMode
		? {
				...commonProps,
				isAddMode: true,
				breadcrumbLabel: __( 'Add new' ),
				subTitle: __(
					'Define a new taxonomy. Fill in the essentials under General; expand Labels to customize.'
				),
				onSaved: ( saved ) =>
					navigate( {
						to: `${ TAXONOMIES_PATH }/${ saved.id }`,
					} ),
		  }
		: {
				...commonProps,
				isAddMode: false,
				breadcrumbLabel: title,
				subTitle: __(
					'Edit this taxonomy. Expand the Labels section to adjust labels.'
				),
		  };

	// key remounts TaxonomyPage when navigating between records so in-flight
	// form state doesn't leak across different taxonomies.
	return <TaxonomyPage key={ id } { ...taxonomyPageProps } />;
}

function TaxonomyPage( {
	isAddMode,
	initialData,
	title,
	breadcrumbLabel,
	subTitle,
	onSaved,
}: TaxonomyPageProps ) {
	const [ data, setData ] = useState< TaxonomyFormData >( initialData );
	const [ isSaving, setIsSaving ] = useState( false );
	const originalSlug = ! isAddMode ? initialData.slug : undefined;
	const slugField = useSlugField( originalSlug, data.slug );
	const objectTypeField = useObjectTypeField();
	const fields = useMemo(
		() =>
			[
				// General
				pluralLabelField,
				singularLabelField,
				slugField,
				descriptionField,
				objectTypeField,
				hierarchicalField,
				statusField,
				// Visibility
				publicField,
				showInRestField,
				publiclyQueryableField,
				showUiField,
				showInMenuField,
				showInQuickEditField,
				showAdminColumnField,
				showInNavMenusField,
				showTagcloudField,
				// Labels
				labelsActionsField,
				menuNameField,
				allItemsField,
				editItemField,
				viewItemField,
				updateItemField,
				addNewItemLabelField,
				newItemNameField,
				searchItemsField,
				notFoundField,
				backToItemsField,
				parentItemField,
				popularItemsField,
				separateItemsField,
				parentItemColonField,
				addOrRemoveItemsField,
				chooseFromMostUsedField,
				// Advanced
				sortField,
				defaultTermEnabledField,
				defaultTermNameField,
			] as Field< TaxonomyFormData >[],
		[ slugField, objectTypeField ]
	);

	const form = useMemo< Form >(
		() => ( {
			layout: { type: 'card', isCollapsible: true },
			fields: [
				{
					id: 'general',
					label: __( 'General' ),
					description: __(
						'Core identity, post types, and activation.'
					),
					layout: {
						type: 'card',
						isCollapsible: true,
						isOpened: true,
					},
					children: generalFormFields,
				},
				{
					id: 'visibility',
					label: __( 'Visibility' ),
					description: __(
						'Where this taxonomy appears: REST API, admin UI, and front-end surfaces.'
					),
					layout: {
						type: 'card',
						isCollapsible: true,
						isOpened: false,
					},
					children: visibilityFormFields,
				},
				{
					id: 'labels',
					label: __( 'Labels' ),
					layout: {
						type: 'card',
						isCollapsible: true,
						isOpened: false,
					},
					children: labelsFormFields,
				},
				{
					id: 'advanced',
					label: __( 'Advanced' ),
					layout: {
						type: 'card',
						isCollapsible: true,
						isOpened: false,
					},
					children: advancedFormFields,
				},
			],
		} ),
		[]
	);

	const { validity, isValid } = useFormValidity( data, fields, form );

	const formId = useInstanceId( TaxonomyPage, 'taxonomy-form' );

	const { saveEntityRecord } = useDispatch( coreStore );
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );
	const maybeInvalidateCache = useMaybeInvalidateContentTypeCache();

	async function onSave() {
		if ( isSaving || ! isValid ) {
			return;
		}
		setIsSaving( true );
		try {
			const saved = ( await saveEntityRecord(
				'postType',
				TAXONOMY_ENTITY,
				serializeForSave( data ),
				{ throwOnError: true }
			) ) as { id: number } | undefined;
			const successMessage = isAddMode
				? sprintf(
						/* translators: %s: taxonomy plural label. */
						__( '"%s" taxonomy created.' ),
						data.title.raw
				  )
				: sprintf(
						/* translators: %s: taxonomy plural label. */
						__( '"%s" taxonomy updated.' ),
						data.title.raw
				  );
			createSuccessNotice( successMessage, { type: 'snackbar' } );
			maybeInvalidateCache(
				initialData.config.object_type,
				data.config.object_type,
				POST_TYPE_ENTITY
			);
			if ( saved?.id !== undefined ) {
				onSaved?.( { ...data, id: saved.id } );
			}
		} catch ( error: any ) {
			let errorMessage: string;
			if ( error?.message && error?.code !== 'unknown_error' ) {
				errorMessage = error.message;
			} else if ( isAddMode ) {
				errorMessage = __( 'Failed to create taxonomy.' );
			} else {
				errorMessage = __( 'Failed to update taxonomy.' );
			}
			createErrorNotice( errorMessage, { type: 'snackbar' } );
		} finally {
			setIsSaving( false );
		}
	}

	return (
		<Page
			ariaLabel={ title }
			breadcrumbs={
				<Breadcrumbs
					items={ [
						{ label: __( 'Taxonomies' ), to: TAXONOMIES_PATH },
						{ label: breadcrumbLabel },
					] }
				/>
			}
			subTitle={ subTitle }
			actions={
				<Button
					__next40pxDefaultSize
					variant="primary"
					size="compact"
					type="submit"
					form={ formId }
					isBusy={ isSaving }
					disabled={ isSaving || ! isValid }
					accessibleWhenDisabled
				>
					{ isAddMode ? __( 'Create' ) : __( 'Save' ) }
				</Button>
			}
		>
			<Stack
				direction="column"
				gap="md"
				className="taxonomy-form"
				render={
					<form
						id={ formId }
						onSubmit={ ( event ) => {
							event.preventDefault();
							onSave();
						} }
					/>
				}
			>
				<DataForm< TaxonomyFormData >
					data={ data }
					fields={ fields }
					form={ form }
					validity={ validity }
					onChange={ ( edits ) =>
						setData(
							( prev ) =>
								( {
									...prev,
									...edits,
								} ) as TaxonomyFormData
						)
					}
				/>
			</Stack>
		</Page>
	);
}
