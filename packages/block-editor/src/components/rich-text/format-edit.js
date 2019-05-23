/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';
import { getActiveFormat, getActiveObject } from '@wordpress/rich-text';

const FormatEdit = ( { formatTypes, onChange, value } ) => {
	return (
		<>
			{ formatTypes.map( ( { name, edit: Edit } ) => {
				if ( ! Edit ) {
					return null;
				}

				const activeFormat = getActiveFormat( value, name );
				const isActive = activeFormat !== undefined;
				const activeObject = getActiveObject( value );
				const isObjectActive = activeObject !== undefined;

				return (
					<Edit
						key={ name }
						isActive={ isActive }
						activeAttributes={
							isActive ? activeFormat.attributes || {} : {}
						}
						isObjectActive={ isObjectActive }
						activeObjectAttributes={
							isObjectActive ? activeObject.attributes || {} : {}
						}
						value={ value }
						onChange={ onChange }
					/>
				);
			} ) }
		</>
	);
};

export default withSelect(
	( select ) => {
		const { getFormatTypes } = select( 'core/rich-text' );

		return {
			formatTypes: getFormatTypes(),
		};
	}
)( FormatEdit );
