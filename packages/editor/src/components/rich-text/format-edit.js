/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { getActiveFormat, getFormatTypes } from '@wordpress/rich-text';

const FormatEdit = ( { value, onChange } ) => {
	return (
		<Fragment>
			{ getFormatTypes().map( ( { format, edit: Edit }, i ) =>
				Edit && <Edit
					key={ i }
					isActive={ getActiveFormat( value, format ) !== undefined }
					value={ value }
					onChange={ onChange }
				/>
			) }
		</Fragment>
	);
};

export default FormatEdit;
