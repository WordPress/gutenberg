/**
 * WordPress dependencies
 */
import { DataForm } from '@wordpress/dataviews';
import type { Form, Field } from '@wordpress/dataviews';
import { Spinner, __experimentalVStack as VStack } from '@wordpress/components';
import type { ReactNode } from 'react';

/**
 * Internal dependencies
 */
import { useMediaEditorContext } from '../media-editor-provider';
import type { Media } from '../media-editor-provider';

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

	// Default form structure with panel layout
	const defaultForm: Form = {
		layout: {
			type: 'panel',
		},
		fields: fields.map( ( field: Field< Media > ) => {
			// Use regular layout for main editable fields
			if (
				[ 'title', 'alt_text', 'caption', 'description' ].includes(
					field.id
				)
			) {
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
