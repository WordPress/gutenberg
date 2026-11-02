import { DataForm } from '@wordpress/dataviews';
import type { Form } from '@wordpress/dataviews';
import {
	Spinner as WCSpinner,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { VisuallyHidden } from '@wordpress/ui';
import { __ } from '@wordpress/i18n';
import type { ReactNode } from 'react';
import { useMediaEditorContext } from '../media-editor-provider';

/*
 * The form used when neither the component nor the provider settings have
 * one, mirroring the `form` of the `attachment` view configuration on the
 * server. It lists the core attachment fields in a fixed order, so the layout
 * does not depend on the order the fields are passed in: the editable fields
 * first, in a regular layout, then the metadata and the file information, in
 * panels. A field it lists that is not passed renders nothing.
 */
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
 * title, alt text, caption, description, etc. The fields are laid out with
 * the `form` prop, else the form of the provider settings, else a default
 * form of the core attachment fields.
 *
 * @param props        - Component props.
 * @param props.form   - Optional form configuration, which takes precedence
 *                     over the form of the provider settings.
 * @param props.header - Optional header content to display above the form.
 * @return The MediaForm component.
 */
export default function MediaForm( {
	form: formOverrides,
	header,
}: MediaFormProps ) {
	const {
		media,
		fields,
		form: settingsForm,
		onChange,
	} = useMediaEditorContext();

	if ( ! media || ! onChange ) {
		return (
			<div className="media-editor-form media-editor-form--loading">
				<WCSpinner />
			</div>
		);
	}

	const form = formOverrides || settingsForm || DEFAULT_FORM;

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
