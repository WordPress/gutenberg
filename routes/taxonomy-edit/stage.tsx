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
import {
	addNewItemLabelField,
	addOrRemoveItemsField,
	allItemsField,
	backToItemsField,
	BLANK_RECORD,
	chooseFromMostUsedField,
	descriptionField,
	editItemField,
	generalForm,
	hierarchicalField,
	labelsForm,
	menuNameField,
	newItemNameField,
	notFoundField,
	parentItemColonField,
	parentItemField,
	pluralLabelField,
	popularItemsField,
	publicField,
	searchItemsField,
	separateItemsField,
	serializeForSave,
	singularLabelField,
	statusField,
	toFormData,
	updateItemField,
	useObjectTypeField,
	useSlugField,
	viewItemField,
	type TaxonomyFormData,
	type TaxonomyRecord,
} from '@wordpress/user-taxonomies';

/**
 * Internal dependencies
 */
import './taxonomy-form.scss';

const NEW_ID = 'new';
const USER_TAXONOMY_POST_TYPE = 'wp_user_taxonomy';

type TaxonomyPageProps = {
	isAddMode: boolean;
	initialData: TaxonomyFormData;
	title: string;
	breadcrumbLabel: string;
	subTitle: string;
	onSaved?: ( saved: TaxonomyFormData & { id: number } ) => void;
};

function TaxonomyEditStage() {
	const { id } = useParams( { from: '/edit/$id' } );
	const navigate = useNavigate();
	const isAddMode = id === NEW_ID;
	const taxonomyId = parseInt( id, 10 );
	const initialData = useSelect(
		( select ) => {
			if ( isAddMode ) {
				return BLANK_RECORD;
			}
			// beforeLoad (route.ts) guarantees the record is in cache.
			const record = select(
				coreStore
			).getEntityRecord< TaxonomyRecord >(
				'postType',
				USER_TAXONOMY_POST_TYPE,
				taxonomyId
			)!;
			return toFormData( record );
		},
		[ isAddMode, taxonomyId ]
	);

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
				onSaved: ( saved ) => navigate( { to: `/edit/${ saved.id }` } ),
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
	const fields = useMemo< Field< TaxonomyFormData >[] >(
		() => [
			// General
			pluralLabelField,
			singularLabelField,
			slugField,
			descriptionField,
			objectTypeField,
			publicField,
			hierarchicalField,
			statusField,
			// Labels
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
		],
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
					children: generalForm.fields,
				},
				{
					id: 'labels',
					label: __( 'Labels' ),
					description: __(
						'Override the text WordPress shows in admin lists, menus, and forms. Leave blank to use defaults derived from the plural and singular names.'
					),
					layout: {
						type: 'card',
						isCollapsible: true,
						isOpened: false,
					},
					children: labelsForm.fields,
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

	async function onSave() {
		if ( isSaving || ! isValid ) {
			return;
		}
		setIsSaving( true );
		try {
			const saved = ( await saveEntityRecord(
				'postType',
				USER_TAXONOMY_POST_TYPE,
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
						{ label: __( 'Taxonomies' ), to: '/' },
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
					disabled={ isSaving }
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

export const stage = TaxonomyEditStage;
