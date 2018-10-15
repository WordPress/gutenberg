/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { getActiveFormat, getFormatTypes } from '@wordpress/rich-text';

const FormatEdit = ( { value, onChange } ) => {
	return (
		<Fragment>
			{ getFormatTypes().map( ( { name, edit: Edit }, i ) => {
				if ( ! Edit ) {
					return null;
				}

				const activeFormat = getActiveFormat( value, name );
				const isActive = activeFormat !== undefined;
				const activeAttributes = isActive ? activeFormat.attributes || {} : {};

				return (
					<Edit
						key={ i }
						isActive={ isActive }
						activeAttributes={ activeAttributes }
						value={ value }
						onChange={ onChange }
					/>
				);
			} ) }
		</Fragment>
	);
};

export default FormatEdit;
