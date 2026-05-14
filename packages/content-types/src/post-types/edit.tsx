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
	addNewField,
	addNewItemLabelField,
	allItemsField,
	archivesField,
	attributesField,
	descriptionField,
	editItemField,
	featuredImageField,
	filterItemsListField,
	generalForm,
	hasArchiveField,
	hierarchicalField,
	insertIntoItemField,
	itemsListField,
	itemsListNavigationField,
	labelsActionsField,
	labelsForm,
	menuNameField,
	newItemField,
	notFoundField,
	notFoundInTrashField,
	parentItemColonField,
	publicField,
	removeFeaturedImageField,
	searchItemsField,
	setFeaturedImageField,
	showInRestField,
	supportsField,
	uploadedToThisItemField,
	useFeaturedImageField,
	useSlugField,
	useTaxonomiesField,
	viewItemField,
	viewItemsField,
} from './fields';
import {
	pluralLabelField,
	singularLabelField,
	statusField,
} from '../utils/fields';
import type { PostTypeFormData, PostTypeRecord } from './types';
import { BLANK_RECORD, serializeForSave, toFormData } from './utils';
import { useMaybeInvalidateContentTypeCache } from '../utils/use-maybe-invalidate-content-type-cache';
import {
	NEW_ID,
	POST_TYPE_ENTITY,
	POST_TYPES_PATH,
	TAXONOMY_ENTITY,
} from '../constants';

type PostTypePageProps = {
	isAddMode: boolean;
	initialData: PostTypeFormData;
	title: string;
	breadcrumbLabel: string;
	subTitle: string;
	onSaved?: ( saved: PostTypeFormData & { id: number } ) => void;
};

export function PostTypeEdit() {
	const { id } = useParams( { from: `${ POST_TYPES_PATH }/$id` } );
	const navigate = useNavigate();
	const isAddMode = id === NEW_ID;
	const postTypeId = parseInt( id, 10 );
	const record = useSelect(
		( select ) => {
			return (
				! isAddMode &&
				// beforeLoad (route.ts) guarantees the record is in cache.
				select( coreStore ).getEntityRecord< PostTypeRecord >(
					'postType',
					POST_TYPE_ENTITY,
					postTypeId
				)!
			);
		},
		[ isAddMode, postTypeId ]
	);
	const initialData =
		! isAddMode && record ? toFormData( record ) : BLANK_RECORD;
	const title = isAddMode ? __( 'Add post type' ) : initialData.title.raw;
	const commonProps = { initialData, title };
	const postTypePageProps: PostTypePageProps = isAddMode
		? {
				...commonProps,
				isAddMode: true,
				breadcrumbLabel: __( 'Add new' ),
				subTitle: __(
					'Define a new post type. Fill in the essentials under General; expand Labels to customize.'
				),
				onSaved: ( saved ) =>
					navigate( {
						to: `${ POST_TYPES_PATH }/${ saved.id }`,
					} ),
		  }
		: {
				...commonProps,
				isAddMode: false,
				breadcrumbLabel: title,
				subTitle: __(
					'Edit this post type. Expand the Labels section to adjust labels.'
				),
		  };

	// key remounts PostTypePage when navigating between records so in-flight
	// form state doesn't leak across different post types.
	return <PostTypePage key={ id } { ...postTypePageProps } />;
}

function PostTypePage( {
	isAddMode,
	initialData,
	title,
	breadcrumbLabel,
	subTitle,
	onSaved,
}: PostTypePageProps ) {
	const [ data, setData ] = useState< PostTypeFormData >( initialData );
	const [ isSaving, setIsSaving ] = useState( false );
	const originalSlug = ! isAddMode ? initialData.slug : undefined;
	const slugField = useSlugField( originalSlug, data.slug );
	const taxonomiesField = useTaxonomiesField();
	const fields = useMemo(
		() =>
			[
				// General
				pluralLabelField,
				singularLabelField,
				slugField,
				descriptionField,
				taxonomiesField,
				supportsField,
				publicField,
				hierarchicalField,
				hasArchiveField,
				showInRestField,
				statusField,
				// Labels
				labelsActionsField,
				menuNameField,
				allItemsField,
				addNewField,
				addNewItemLabelField,
				editItemField,
				newItemField,
				viewItemField,
				viewItemsField,
				searchItemsField,
				notFoundField,
				notFoundInTrashField,
				parentItemColonField,
				archivesField,
				attributesField,
				insertIntoItemField,
				uploadedToThisItemField,
				featuredImageField,
				setFeaturedImageField,
				removeFeaturedImageField,
				useFeaturedImageField,
				filterItemsListField,
				itemsListNavigationField,
				itemsListField,
			] as Field< PostTypeFormData >[],
		[ slugField, taxonomiesField ]
	);

	const form = useMemo< Form >(
		() => ( {
			layout: { type: 'card', isCollapsible: true },
			fields: [
				{
					id: 'general',
					label: __( 'General' ),
					description: __(
						'Core identity, taxonomies, supports, and activation.'
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

	const formId = useInstanceId( PostTypePage, 'post-type-form' );

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
				POST_TYPE_ENTITY,
				serializeForSave( data ),
				{ throwOnError: true }
			) ) as { id: number } | undefined;
			const successMessage = isAddMode
				? sprintf(
						/* translators: %s: post type plural label. */
						__( '"%s" post type created.' ),
						data.title.raw
				  )
				: sprintf(
						/* translators: %s: post type plural label. */
						__( '"%s" post type updated.' ),
						data.title.raw
				  );
			createSuccessNotice( successMessage, { type: 'snackbar' } );
			maybeInvalidateCache(
				initialData.config.taxonomies,
				data.config.taxonomies,
				TAXONOMY_ENTITY
			);
			if ( saved?.id !== undefined ) {
				onSaved?.( { ...data, id: saved.id } );
			}
		} catch ( error: any ) {
			let errorMessage: string;
			if ( error?.message && error?.code !== 'unknown_error' ) {
				errorMessage = error.message;
			} else if ( isAddMode ) {
				errorMessage = __( 'Failed to create post type.' );
			} else {
				errorMessage = __( 'Failed to update post type.' );
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
						{ label: __( 'Post Types' ), to: POST_TYPES_PATH },
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
				className="post-type-form"
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
				<DataForm< PostTypeFormData >
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
								} ) as PostTypeFormData
						)
					}
				/>
			</Stack>
		</Page>
	);
}
