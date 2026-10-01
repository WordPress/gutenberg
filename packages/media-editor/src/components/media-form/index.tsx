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

	// The core fields come first, in a fixed order, so the form does not
	// depend on the order the fields are registered in; the ones that are not
	// registered render nothing. Any other field follows, in the order it was
	// given.
	const fieldIds = [
		...ORDERED_FIELD_IDS,
		...fields
			.map( ( field: Field< Media > ) => field.id )
			.filter( ( id: string ) => ! ORDERED_FIELD_IDS.includes( id ) ),
	];

	// Default form structure with panel layout
	const defaultForm: Form = {
		layout: {
			type: 'panel',
		},
		fields: fieldIds.map( ( id ) => {
			// Use regular layout for main editable fields
			if ( REGULAR_FIELD_IDS.includes( id ) ) {
				return {
					id,
					layout: {
						type: 'regular',
						labelPosition: 'top',
					},
				};
			}
			return id;
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
