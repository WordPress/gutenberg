/**
 * WordPress dependencies
 */
import { getActiveFormat, getActiveObject } from '@wordpress/rich-text';

const EMPTY_CONTEXT = {};

function Edit( {
	onChange,
	onFocus,
	value,
	forwardedRef,
	settings,
	isVisible,
} ) {
	const { name, edit: EditFunction } = settings;

	if ( ! EditFunction ) {
		return null;
	}

	const activeFormat = getActiveFormat( value, name );
	const isActive = activeFormat !== undefined;
	const activeObject = getActiveObject( value );
	const isObjectActive =
		activeObject !== undefined && activeObject.type === name;

	return (
		<EditFunction
			key={ name }
			isActive={ isActive }
			isVisible={ isVisible }
			activeAttributes={ isActive ? activeFormat.attributes || {} : {} }
			isObjectActive={ isObjectActive }
			activeObjectAttributes={
				isObjectActive ? activeObject.attributes || {} : {}
			}
			value={ value }
			onChange={ onChange }
			onFocus={ onFocus }
			contentRef={ forwardedRef }
			context={ EMPTY_CONTEXT }
		/>
	);
}

export default function FormatEdit( { formatTypes, ...props } ) {
	return formatTypes.map( ( settings ) => (
		<Edit settings={ settings } { ...props } key={ settings.name } />
	) );
}
