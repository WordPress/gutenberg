/**
 * Internal dependencies
 */
import { getActiveFormat } from '../get-active-format';
import { getActiveObject } from '../get-active-object';

export default function FormatEdit( {
	always,
	formatTypes,
	onChange,
	onFocus,
	value,
	forwardedRef,
} ) {
	return formatTypes.map( ( settings ) => {
		const { name, edit, alwaysEdit } = settings;
		const Edit = always ? alwaysEdit : edit;

		if ( ! Edit ) {
			return null;
		}

		const activeFormat = getActiveFormat( value, name );
		const isActive = activeFormat !== undefined;
		const activeObject = getActiveObject( value );
		const isObjectActive =
			activeObject !== undefined && activeObject.type === name;

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
				onFocus={ onFocus }
				contentRef={ forwardedRef }
			/>
		);
	} );
}
