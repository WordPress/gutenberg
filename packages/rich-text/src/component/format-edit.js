/**
 * WordPress dependencies
 */
import { useMemo, createContext } from '@wordpress/element';

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

export const Range = createContext();
export const FormatSettings = createContext( {} );
export const IsActive = createContext( false );

export default function FormatEdit( {
	formatTypes,
	onChange,
	onFocus,
	value,
	allowedFormats,
	withoutInteractiveFormatting,
	getWin,
} ) {
	const range = useMemo( () => {
		const selection = getWin().getSelection();

		if ( ! selection.rangeCount ) {
			return;
		}

		return selection.getRangeAt( 0 );
	}, [ value.start, value.end ] );

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
				<IsActive.Provider value={ isActive }>
					{ edit }
				</IsActive.Provider>
			</FormatSettings.Provider>
		);
	} );

	return <Range.Provider value={ range }>{ edits }</Range.Provider>;
}
