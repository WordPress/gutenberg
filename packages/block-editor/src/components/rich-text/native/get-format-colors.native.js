/**
 * Internal dependencies
 */
import { getColorObjectByAttributeValues } from '../../../components/colors';

const FORMAT_TYPE = 'core/text-color';
const REGEX_TO_MATCH = /^has-(.*)-color$/;

export function getFormatColors( formats, colors ) {
	const newFormats = formats.slice();

	// We are looping through a sparse array where empty indices will be
	// skipped.
	newFormats.forEach( ( format ) => {
		format.forEach( ( currentFormat ) => {
			if ( currentFormat?.type === FORMAT_TYPE ) {
				const className = currentFormat?.attributes?.class;

				className?.split( ' ' ).forEach( ( currentClass ) => {
					const match = currentClass.match( REGEX_TO_MATCH );
					if ( match ) {
						const [ , colorSlug ] =
							currentClass.match( REGEX_TO_MATCH );
						const colorObject = getColorObjectByAttributeValues(
							colors,
							colorSlug
						);
						const currentStyles = currentFormat?.attributes?.style;
						if (
							colorObject?.color &&
							( ! currentStyles ||
								currentStyles?.indexOf( colorObject.color ) ===
									-1 )
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
