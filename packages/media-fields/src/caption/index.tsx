import { __ } from '@wordpress/i18n';
import { TextareaControl as WCTextareaControl } from '@wordpress/components';
import type { Attachment, Updatable } from '@wordpress/core-data';
import type { Field } from '@wordpress/dataviews';
import { getRawContent } from '../utils/get-raw-content';

const captionField: Partial< Field< Updatable< Attachment > > > = {
	id: 'caption',
	type: 'text',
	label: __( 'Caption' ),
	getValue: ( { item } ) => getRawContent( item?.caption ),
	render: ( { item } ) => getRawContent( item?.caption ) || '-',
	Edit: ( { field, onChange, data } ) => {
		return (
			<WCTextareaControl
				label={ field.label }
				value={ getRawContent( data.caption ) || '' }
				onChange={ ( value ) => onChange( { caption: value } ) }
				rows={ 2 }
			/>
		);
	},
	enableSorting: false,
	filterBy: false,
};

export default captionField;
