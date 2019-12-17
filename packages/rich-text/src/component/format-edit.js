/**
 * Internal dependencies
 */
import { getActiveFormat } from '../get-active-format';
import { getActiveObject } from '../get-active-object';

/**
 * Set of all interactive content tags.
 *
 * @see https://html.spec.whatwg.org/multipage/dom.html#interactive-content
 */
const interactiveContentTags = new Set( [
	'a',
	'audio',
	'button',
	'details',
	'embed',
	'iframe',
	'input',
	'label',
	'select',
	'textarea',
	'video',
] );

export default function FormatEdit( {
	formatTypes,
	onChange,
	value,
	allowedFormats,
	withoutInteractiveFormatting,
} ) {
	return formatTypes.map( ( {
		name,
		edit: Edit,
		tagName,
	} ) => {
		if ( ! Edit ) {
			return null;
		}

		if ( allowedFormats && allowedFormats.indexOf( name ) === -1 ) {
			return null;
		}

		if (
			withoutInteractiveFormatting &&
			interactiveContentTags.has( tagName )
		) {
			return null;
		}

		const activeFormat = getActiveFormat( value, name );
		const isActive = activeFormat !== undefined;
		const activeObject = getActiveObject( value );
		const isObjectActive = activeObject !== undefined && activeObject.type === name;

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
	} );
}
