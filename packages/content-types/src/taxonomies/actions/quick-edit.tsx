/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { closeSmall, pencil } from '@wordpress/icons';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';
import {
	DataForm,
	useFormValidity,
	type Action,
	type Field,
} from '@wordpress/dataviews';
import { useMemo, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { Stack, Text } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import {
	defaultForm,
	hierarchicalField,
	publicField,
	useObjectTypeField,
	useSlugField,
} from '../fields';
import {
	pluralLabelField,
	singularLabelField,
	statusField,
} from '../../utils/fields';
import type { TaxonomyFormData } from '../types';
import { serializeForSave } from '../utils';
import { useMaybeInvalidateContentTypeCache } from '../../utils/use-maybe-invalidate-content-type-cache';
import { POST_TYPE_ENTITY, TAXONOMY_ENTITY } from '../../constants';

function QuickEditTaxonomyModal( {
	items,
	closeModal,
}: {
	items: TaxonomyFormData[];
	closeModal?: () => void;
} ) {
	const item = items[ 0 ];
	const [ data, setData ] = useState< TaxonomyFormData >( item );
	const [ isSaving, setIsSaving ] = useState( false );
	const slugField = useSlugField( item.slug, data.slug );
	const objectTypeField = useObjectTypeField();

	const fields = useMemo(
		() =>
			[
				pluralLabelField,
				singularLabelField,
				slugField,
				objectTypeField,
				publicField,
				hierarchicalField,
				statusField,
			] as Field< TaxonomyFormData >[],
		[ slugField, objectTypeField ]
	);

	const { validity, isValid } = useFormValidity( data, fields, defaultForm );
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
			await saveEntityRecord(
				'postType',
				TAXONOMY_ENTITY,
				serializeForSave( { ...data, id: item.id } ),
				{ throwOnError: true }
			);
			createSuccessNotice(
				sprintf(
					/* translators: %s: taxonomy plural label. */
					__( '"%s" taxonomy updated.' ),
					data.title.raw
				),
				{ type: 'snackbar' }
			);
			maybeInvalidateCache(
				item.config.object_type,
				data.config.object_type,
				POST_TYPE_ENTITY
			);
			closeModal?.();
		} catch ( error: any ) {
			createErrorNotice(
				error?.message && error?.code !== 'unknown_error'
					? error.message
					: __( 'Failed to update taxonomy.' ),
				{ type: 'snackbar' }
			);
		} finally {
			setIsSaving( false );
		}
	}

	return (
		<form
			onSubmit={ ( event ) => {
				event.preventDefault();
				onSave();
			} }
		>
			<Stack
				className="dataviews-action-modal__quick-edit-taxonomy-header"
				direction="row"
				justify="space-between"
				align="center"
			>
				<Text variant="heading-sm" render={ <h2 /> }>
					{ __( 'Quick edit taxonomy' ) }
				</Text>
				<Button
					size="small"
					icon={ closeSmall }
					label={ __( 'Close' ) }
					onClick={ closeModal }
				/>
			</Stack>
			<div className="dataviews-action-modal__quick-edit-taxonomy-content">
				<DataForm< TaxonomyFormData >
					data={ data }
					fields={ fields }
					form={ defaultForm }
					validity={ validity }
					onChange={ ( edits ) =>
						setData(
							( prev ) =>
								( { ...prev, ...edits } ) as TaxonomyFormData
						)
					}
				/>
			</div>
			<Stack
				className="dataviews-action-modal__quick-edit-taxonomy-footer"
				direction="row"
				gap="sm"
			>
				<Button
					__next40pxDefaultSize
					variant="secondary"
					onClick={ closeModal }
				>
					{ __( 'Cancel' ) }
				</Button>
				<Button
					__next40pxDefaultSize
					variant="primary"
					type="submit"
					isBusy={ isSaving }
					disabled={ isSaving || ! isValid }
					accessibleWhenDisabled
				>
					{ __( 'Done' ) }
				</Button>
			</Stack>
		</form>
	);
}

const quickEditTaxonomyAction: Action< TaxonomyFormData > = {
	id: 'quick-edit-taxonomy',
	label: __( 'Quick edit' ),
	icon: pencil,
	isPrimary: true,
	hideModalHeader: true,
	RenderModal: QuickEditTaxonomyModal,
};

export default quickEditTaxonomyAction;
