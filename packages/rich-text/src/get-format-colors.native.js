/**
 * WordPress dependencies
 */
import { getColorObjectByAttributeValues } from '@wordpress/block-editor';

const FORMAT_TYPE = 'core/text-color';
const REGEX_TO_MATCH = /^has-(.*)-color$/;
const TAGS_TO_SEARCH = /\<mark/;

export function getFormatColors( value, formats, colors ) {
	if ( value?.search( TAGS_TO_SEARCH ) !== -1 ) {
		const newFormats = formats.slice();

		newFormats.forEach( ( format ) => {
			format.forEach( ( currentFormat ) => {
				if ( currentFormat?.type === FORMAT_TYPE ) {
					const className = currentFormat?.attributes?.class;
					currentFormat.attributes.style = currentFormat.attributes.style.replace(
						/ /g,
						''
					);

					className?.split( ' ' ).forEach( ( currentClass ) => {
						const match = currentClass.match( REGEX_TO_MATCH );
						if ( match ) {
							const [ , colorSlug ] = currentClass.match(
								REGEX_TO_MATCH
							);
							const colorObject = getColorObjectByAttributeValues(
								colors,
								colorSlug
							);
							const currentStyles =
								currentFormat?.attributes?.style;
							if (
								colorObject &&
								( ! currentStyles ||
									currentStyles?.indexOf(
										colorObject.color
									) === -1 )
							) {
								currentFormat.attributes.style = [
									`color: ${ colorObject.color }`,
									currentStyles,
								].join( ';' );
							}
						}
					} );
				}
			} );
		} );

		return newFormats;
	}

	return formats;
}
