/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	DataForm,
	useFormValidity,
	type Action,
	type Field,
	type Form,
} from '@wordpress/dataviews';
import { useMemo, useState } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';
import { copy } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { useSlugField } from '../fields/general';
import { pluralLabelField, singularLabelField } from '../../utils/fields';
import { serializeForSave } from '../utils';
import type { TaxonomyFormData } from '../types';
import type { CoreDataError } from '../../types';
import { TAXONOMY_ENTITY } from '../../constants';

const SLUG_MAX_LENGTH = 32;

const duplicateForm: Form = {
	layout: { type: 'regular' },
	fields: [ 'plural_name', 'singular_name', 'slug' ],
};

function buildCopySlug( slug: string, takenSlugs: Set< string > ): string {
	const match = slug.match( /^(.*?)(\d+)$/ );
	const base = match ? match[ 1 ] : slug;
	let num = match ? parseInt( match[ 2 ], 10 ) + 1 : 2;
	let candidate: string;
	do {
		const nextNumber = String( num );
		candidate = `${ base.slice(
			0,
			SLUG_MAX_LENGTH - nextNumber.length
		) }${ nextNumber }`;
		num++;
	} while ( takenSlugs.has( candidate ) );
	return candidate;
}

function DuplicateTaxonomyModal( {
	items,
	closeModal,
	onActionPerformed,
}: {
	items: TaxonomyFormData[];
	closeModal?: () => void;
	onActionPerformed?: ( items: TaxonomyFormData[] ) => void;
} ) {
	const source = items[ 0 ];
	const takenSlugs = useSelect( ( select ) => {
		const taxonomies = select( coreStore ).getTaxonomies() ?? [];
		const drafts =
			select( coreStore ).getEntityRecords( 'postType', TAXONOMY_ENTITY, {
				status: 'draft',
				per_page: -1,
				_fields: 'id,slug',
			} ) ?? [];
		return new Set< string >( [
			...taxonomies.map( ( t: any ) => t.slug ),
			...drafts.map( ( d: any ) => d.slug ),
		] );
	}, [] );
	const [ data, setData ] = useState< TaxonomyFormData >( () => ( {
		...source,
		id: undefined,
		status: 'draft',
		title: {
			raw: sprintf(
				/* translators: %s: existing taxonomy title. */
				_x( '%s (Copy)', 'taxonomy' ),
				source.title.raw
			),
		},
		slug: buildCopySlug( source.slug, takenSlugs ),
	} ) );
	const [ isDuplicating, setIsDuplicating ] = useState( false );
	const slugField = useSlugField( undefined, data.slug );

	const fields = useMemo(
		() =>
			[
				pluralLabelField,
				singularLabelField,
				slugField,
			] as Field< TaxonomyFormData >[],
		[ slugField ]
	);

	const { validity, isValid } = useFormValidity(
		data,
		fields,
		duplicateForm
	);
	const { saveEntityRecord } = useDispatch( coreStore );
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );

	async function onDuplicate() {
		if ( isDuplicating || ! isValid ) {
			return;
		}
		setIsDuplicating( true );
		try {
			await saveEntityRecord(
				'postType',
				TAXONOMY_ENTITY,
				serializeForSave( data ),
				{ throwOnError: true }
			);
			createSuccessNotice(
				sprintf(
					/* translators: %s: taxonomy plural label. */
					__( '"%s" taxonomy created.' ),
					data.title.raw
				),
				{ type: 'snackbar' }
			);
			onActionPerformed?.( items );
			closeModal?.();
		} catch ( error ) {
			const typedError = error as CoreDataError;
			createErrorNotice(
				typedError?.message && typedError.code !== 'unknown_error'
					? typedError.message
					: __( 'Failed to duplicate taxonomy.' ),
				{ type: 'snackbar' }
			);
		} finally {
			setIsDuplicating( false );
		}
	}

	return (
		<Stack direction="column" gap="md">
			<DataForm< TaxonomyFormData >
				data={ data }
				fields={ fields }
				form={ duplicateForm }
				validity={ validity }
				onChange={ ( edits ) =>
					setData(
						( prev ) =>
							( { ...prev, ...edits } ) as TaxonomyFormData
					)
				}
			/>
			<Stack direction="row" justify="flex-end" gap="sm">
				<Button
					__next40pxDefaultSize
					variant="tertiary"
					onClick={ closeModal }
					disabled={ isDuplicating }
					accessibleWhenDisabled
				>
					{ __( 'Cancel' ) }
				</Button>
				<Button
					__next40pxDefaultSize
					variant="primary"
					isBusy={ isDuplicating }
					disabled={ isDuplicating || ! isValid }
					accessibleWhenDisabled
					onClick={ onDuplicate }
				>
					{ _x( 'Duplicate', 'action label' ) }
				</Button>
			</Stack>
		</Stack>
	);
}

const duplicateTaxonomyAction: Action< TaxonomyFormData > = {
	id: 'duplicate-taxonomy',
	label: _x( 'Duplicate', 'action label' ),
	icon: copy,
	modalHeader: __( 'Duplicate taxonomy' ),
	modalFocusOnMount: 'firstContentElement',
	RenderModal: DuplicateTaxonomyModal,
};

export default duplicateTaxonomyAction;
