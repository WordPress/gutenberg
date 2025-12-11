/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { TextareaControl } from '@wordpress/components';
import type { Attachment, Updatable } from '@wordpress/core-data';
import type { Field } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import { getRawContent } from '../utils/get-raw-content';

const descriptionField: Partial< Field< Updatable< Attachment > > > = {
	id: 'description',
	type: 'text',
	label: __( 'Description' ),
	getValue: ( { item } ) => getRawContent( item?.description ),
	render: ( { item } ) => (
		<div>{ getRawContent( item?.description ) || '-' }</div>
	),
	Edit: ( { field, onChange, data } ) => {
		return (
			<TextareaControl
				label={ field.label }
				value={ getRawContent( data.description ) || '' }
				onChange={ ( value ) => onChange( { description: value } ) }
				rows={ 5 }
				__nextHasNoMarginBottom
			/>
		);
	},
	enableSorting: false,
	filterBy: false,
};

export default descriptionField;
