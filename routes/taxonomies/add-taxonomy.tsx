/**
 * WordPress dependencies
 */
import { Button, Modal } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { DataForm, useFormValidity, type Field } from '@wordpress/dataviews';
import { useMemo, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { Stack } from '@wordpress/ui';

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
} from './fields';
import { serializeForSave } from './utils';
import type { TaxonomyFormData } from './types';

const BLANK_RECORD: TaxonomyFormData = {
	slug: '',
	status: 'publish',
	title: { raw: '' },
	config: {
		labels: { singular_name: '' },
		object_type: [],
		public: true,
		hierarchical: false,
	},
};

function AddTaxonomyModal( {
	addNewLabel,
	onClose,
}: {
	addNewLabel: string;
	onClose: () => void;
} ) {
	const slugField = useSlugField();
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

	const [ data, setData ] = useState< TaxonomyFormData >( {
		...BLANK_RECORD,
	} );
	const [ isSaving, setIsSaving ] = useState( false );
	const { validity, isValid } = useFormValidity( data, fields, defaultForm );

	const { saveEntityRecord } = useDispatch( coreStore );
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );

	async function onSubmit() {
		if ( isSaving || ! isValid ) {
			return;
		}
		setIsSaving( true );
		try {
			await saveEntityRecord(
				'postType',
				'wp_user_taxonomy',
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
			onClose();
		} catch ( error: any ) {
			createErrorNotice(
				error?.message && error?.code !== 'unknown_error'
					? error.message
					: __( 'Failed to create taxonomy.' ),
				{ type: 'snackbar' }
			);
		} finally {
			setIsSaving( false );
		}
	}

	return (
		<Modal
			title={ addNewLabel }
			onRequestClose={ onClose }
			focusOnMount="firstContentElement"
			size="small"
		>
			<Stack
				direction="column"
				gap="md"
				render={
					<form
						onSubmit={ ( event ) => {
							event.preventDefault();
							onSubmit();
						} }
					/>
				}
			>
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
				<Stack direction="row" gap="sm" justify="end">
					<Button
						__next40pxDefaultSize
						variant="tertiary"
						onClick={ onClose }
					>
						{ __( 'Cancel' ) }
					</Button>
					<Button
						__next40pxDefaultSize
						variant="primary"
						type="submit"
						isBusy={ isSaving }
						accessibleWhenDisabled
					>
						{ __( 'Create' ) }
					</Button>
				</Stack>
			</Stack>
		</Modal>
	);
}

export default function AddTaxonomy() {
	const [ isOpen, setIsOpen ] = useState( false );
	const addNewLabel = useSelect(
		( select ) =>
			select( coreStore ).getPostType( 'wp_user_taxonomy' )?.labels
				?.add_new_item ?? __( 'Add taxonomy' ),
		[]
	);
	return (
		<>
			<Button
				variant="primary"
				size="compact"
				__next40pxDefaultSize
				onClick={ () => setIsOpen( true ) }
			>
				{ addNewLabel }
			</Button>
			{ isOpen && (
				<AddTaxonomyModal
					addNewLabel={ addNewLabel }
					onClose={ () => setIsOpen( false ) }
				/>
			) }
		</>
	);
}
