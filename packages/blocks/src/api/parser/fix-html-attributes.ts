import { getSaveContent } from '../serializer';
import { getRootElement, readStyle } from '../undelimited';
import type { BlockType } from '../../types';

/**
 * Returns the attributes of the element a piece of HTML is. Attributes
 * without a value are read as empty strings.
 *
 * @param html HTML.
 */
function getRootAttributes( html: string ): Map< string, string > | null {
	const root = getRootElement( html );
	return root
		? new Map(
				root
					.getAttributeNames()
					.map( ( name ) => [
						name,
						root.getAttribute( name ) ?? '',
					] )
			)
		: null;
}

/**
 * Reads the attributes of a block's root element that its `save` doesn't
 * produce into `htmlAttributes`, so they're shown in the editor and saved
 * again. For `style`, only the properties `save` doesn't set are kept.
 *
 * @param blockAttributes Block attributes.
 * @param blockType       Block type.
 * @param innerHTML       The block's HTML.
 *
 * @return Block attributes.
 */
export function fixHtmlAttributes(
	blockAttributes: Record< string, unknown >,
	blockType: BlockType,
	innerHTML: string
): Record< string, unknown > {
	if ( ! blockType.attributes?.htmlAttributes ) {
		return blockAttributes;
	}

	const { htmlAttributes, ...attributes } = blockAttributes;
	const written = getRootAttributes( innerHTML );
	const saved = getRootAttributes( getSaveContent( blockType, attributes ) );
	if ( ! written || ! saved ) {
		return blockAttributes;
	}

	const extra: Record< string, string > = {};
	for ( const [ name, value ] of written ) {
		if ( name === 'style' ) {
			const savedStyle = readStyle( saved.get( 'style' ) ?? '' );
			const style = value
				.split( ';' )
				.filter( ( declaration ) => {
					const property = declaration.split( ':' )[ 0 ].trim();
					return (
						property && ! savedStyle.has( property.toLowerCase() )
					);
				} )
				.join( ';' );
			if ( style ) {
				extra.style = style;
			}
		} else if ( name !== 'class' && ! saved.has( name ) ) {
			extra[ name ] = value;
		}
	}

	return Object.keys( extra ).length
		? { ...attributes, htmlAttributes: extra }
		: attributes;
}
