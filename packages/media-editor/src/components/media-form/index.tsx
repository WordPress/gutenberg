import { DataForm } from '@wordpress/dataviews';
import type { Form, Field } from '@wordpress/dataviews';
import { Spinner, __experimentalVStack as VStack } from '@wordpress/components';
import { VisuallyHidden } from '@wordpress/ui';
import { __ } from '@wordpress/i18n';
import type { ReactNode } from 'react';
import { useMediaEditorContext } from '../media-editor-provider';
import type { Media } from '../media-editor-provider';

// Fields that use a regular (non-panel) layout, rendered at the top.
const REGULAR_FIELD_IDS = [ 'title', 'alt_text', 'caption', 'description' ];

// Fields shown in panels, below the regular ones: the metadata first, then
// the file information.
const PANEL_FIELD_IDS = [
	'date',
	'author',
	'filename',
	'mime_type',
	'filesize',
	'media_dimensions',
	'attached_to',
];

const ORDERED_FIELD_IDS = [ ...REGULAR_FIELD_IDS, ...PANEL_FIELD_IDS ];

/**
 * The position of a field in the default form: its index among the known
 * fields, or after all of them.
 *
 * @param fieldId The id of the field.
 * @return The rank of the field.
 */
function getFieldRank( fieldId: string ) {
	const index = ORDERED_FIELD_IDS.indexOf( fieldId );
	return index === -1 ? ORDERED_FIELD_IDS.length : index;
}

/**
 * Props for MediaForm component.
 */
export interface MediaFormProps {
	form?: Form;
	header?: ReactNode;
}

/**
 * MediaForm component for editing media metadata.
 *
 * Renders a DataForm with fields for editing media properties like
 * title, alt text, caption, description, etc.
 *
 * @param props        - Component props.
 * @param props.form   - Optional form configuration.
 * @param props.header - Optional header content to display above the form.
 * @return The MediaForm component.
 */
export default function MediaForm( {
	form: formOverrides,
	header,
}: MediaFormProps ) {
	const { media, fields, onChange } = useMediaEditorContext();

	if ( ! media || ! onChange ) {
		return (
			<div className="media-editor-form media-editor-form--loading">
				<Spinner />
			</div>
		);
	}

	// The regular (non-panel) fields come first, then the panel fields, each
	// group in its own order, so the form does not depend on the order the
	// fields are registered in. The sort is stable: any other field follows,
	// in the order it was given.
	const sortedFields = [ ...fields ].sort(
		( a: Field< Media >, b: Field< Media > ) =>
			getFieldRank( a.id ) - getFieldRank( b.id )
	);

	// Default form structure with panel layout
	const defaultForm: Form = {
		layout: {
			type: 'panel',
		},
		fields: sortedFields.map( ( field: Field< Media > ) => {
			// Use regular layout for main editable fields
			if ( REGULAR_FIELD_IDS.includes( field.id ) ) {
				return {
					id: field.id,
					layout: {
						type: 'regular',
						labelPosition: 'top',
					},
				};
			}
			return field.id;
		} ),
	};

	const form = formOverrides || defaultForm;

	return (
		<div className="media-editor-form">
			<VStack spacing={ 4 }>
				<VisuallyHidden render={ <h2 /> }>
					{ __( 'Media details' ) }
				</VisuallyHidden>
				{ header }
				<DataForm
					data={ media }
					fields={ fields }
					form={ form }
					onChange={ onChange }
				/>
			</VStack>
		</div>
	);
}
