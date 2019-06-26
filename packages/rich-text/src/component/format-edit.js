/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';

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

const FormatEdit = ( { formatTypes, onChange, value, withoutInteractiveFormatting } ) => {
	return (
		<>
			{ formatTypes.map( ( {
				name,
				edit: Edit,
				tagName,
			} ) => {
				if ( ! Edit ) {
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
