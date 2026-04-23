/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { closeSmall, pencil } from '@wordpress/icons';
import { store as coreStore, useEntityRecord } from '@wordpress/core-data';
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
import '../style.scss';

/**
 * Internal dependencies
 */
import {
	defaultForm,
	hierarchicalField,
	pluralLabelField,
	publicField,
	singularLabelField,
	statusField,
	useObjectTypeField,
	useSlugField,
} from '../fields';
import { serializeForSave, toFormData } from '../utils';
import type { TaxonomyFormData, TaxonomyRecord } from '../types';

function EditTaxonomyModal( {
	items,
	closeModal,
}: {
	items: TaxonomyFormData[];
	closeModal?: () => void;
} ) {
	const item = items[ 0 ];
	const { record, hasResolved } = useEntityRecord< TaxonomyRecord >(
		'postType',
		'wp_user_taxonomy',
		item.id as number
	);

	const initialData = useMemo< TaxonomyFormData >(
		() => ( record ? toFormData( record ) : item ),
		[ record, item ]
	);

	const [ data, setData ] = useState< TaxonomyFormData >( initialData );
	const [ isSaving, setIsSaving ] = useState( false );
	const slugField = useSlugField( item.slug, data.slug );
	const objectTypeField = useObjectTypeField();

	const fields = useMemo< Field< TaxonomyFormData >[] >(
		() => [
			pluralLabelField,
			singularLabelField,
			slugField,
			objectTypeField,
			publicField,
			hierarchicalField,
			statusField,
		],
		[ slugField, objectTypeField ]
	);

	const { validity, isValid } = useFormValidity( data, fields, defaultForm );
	const { saveEntityRecord } = useDispatch( coreStore );
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );

	async function onSave() {
		if ( isSaving || ! isValid ) {
			return;
		}
		setIsSaving( true );
		try {
			await saveEntityRecord(
				'postType',
				'wp_user_taxonomy',
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

	if ( ! hasResolved ) {
		return null;
	}

	return (
		<>
			<Stack
				className="dataviews-action-modal__edit-taxonomy-header"
				direction="row"
				justify="space-between"
				align="center"
			>
				<Text
					variant="heading-sm"
					render={ <h2 /> }
					className="dataviews-action-modal__edit-taxonomy-title"
				>
					{ __( 'Edit taxonomy' ) }
				</Text>
				<Button
					size="small"
					icon={ closeSmall }
					label={ __( 'Close' ) }
					onClick={ closeModal }
				/>
			</Stack>
			<div className="dataviews-action-modal__edit-taxonomy-content">
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
				className="dataviews-action-modal__edit-taxonomy-footer"
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
					isBusy={ isSaving }
					disabled={ isSaving }
					accessibleWhenDisabled
					onClick={ onSave }
				>
					{ __( 'Done' ) }
				</Button>
			</Stack>
		</>
	);
}

const editTaxonomyAction: Action< TaxonomyFormData > = {
	id: 'edit-taxonomy',
	label: __( 'Edit' ),
	icon: pencil,
	isPrimary: true,
	hideModalHeader: true,
	RenderModal: EditTaxonomyModal,
};

export default editTaxonomyAction;
