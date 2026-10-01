import { DataForm } from '@wordpress/dataviews';
import type { Form } from '@wordpress/dataviews';
import { Spinner, __experimentalVStack as VStack } from '@wordpress/components';
import { VisuallyHidden } from '@wordpress/ui';
import { __ } from '@wordpress/i18n';
import type { ReactNode } from 'react';
import { useMediaEditorContext } from '../media-editor-provider';

// The default form lists the core fields in a fixed order, so it does not
// depend on the order the fields are registered in: the regular (non-panel)
// fields first, then the fields shown in panels (the metadata, then the file
// information). A field that is not registered renders nothing.
const DEFAULT_FORM: Form = {
	layout: {
		type: 'panel',
	},
	fields: [
		...[ 'title', 'alt_text', 'caption', 'description' ].map( ( id ) => ( {
			id,
			layout: {
				type: 'regular' as const,
				labelPosition: 'top' as const,
			},
		} ) ),
		'date',
		'author',
		'filename',
		'mime_type',
		'filesize',
		'media_dimensions',
		'attached_to',
	],
};

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

	const form = formOverrides || DEFAULT_FORM;

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
