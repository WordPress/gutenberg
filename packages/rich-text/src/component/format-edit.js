/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';

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

export const Ref = createContext();
export const FormatSettings = createContext();
export const Value = createContext();

export default function FormatEdit( {
	formatTypes,
	onChange,
	onFocus,
	value,
	allowedFormats,
	withoutInteractiveFormatting,
	forwardedRef,
} ) {
	const edits = formatTypes.map( ( settings ) => {
		const { name, edit: Edit, tagName } = settings;

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
		const isObjectActive =
			activeObject !== undefined && activeObject.type === name;

		const edit = (
			<Edit
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
			/>
		);

		return (
			<FormatSettings.Provider key={ name } value={ settings }>
				<Value.Provider value={ value }>{ edit }</Value.Provider>
			</FormatSettings.Provider>
		);
	} );

	return <Ref.Provider value={ forwardedRef }>{ edits }</Ref.Provider>;
}
