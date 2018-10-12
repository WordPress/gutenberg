/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import {
	getActiveFormat,
} from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import { formatControls } from './format-controls';

const FormatEdit = ( { value, onChange } ) => {
	return (
		<Fragment>
			{ formatControls.map( ( { selector, edit: Edit }, i ) =>
				Edit && <Edit
					key={ i }
					isActive={ getActiveFormat( value, selector ) !== undefined }
					value={ value }
					onChange={ onChange }
				/>
			) }
		</Fragment>
	);
};

export default FormatEdit;
