/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { TextareaControl } from '@wordpress/components';
import type { Field } from '@wordpress/dataviews';
import type { Attachment, Updatable } from '@wordpress/core-data';

const altTextField: Partial< Field< Updatable< Attachment > > > = {
	id: 'alt_text',
	type: 'text',
	label: __( 'Alt text' ),
	isVisible: ( item ) => item?.media_type === 'image',
	render: ( { item } ) => item?.alt_text || '-',
	Edit: ( { field, onChange, data } ) => {
		return (
			<TextareaControl
				label={ field.label }
				value={ data.alt_text || '' }
				onChange={ ( value ) => onChange( { alt_text: value } ) }
				rows={ 2 }
			/>
		);
	},
	enableSorting: false,
	filterBy: false,
};

export default altTextField;
