/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { parse } from '@wordpress/blocks';

function findBlock( blocks, isMatch ) {
	if ( ! Array.isArray( blocks ) ) {
		return;
	}
	for ( const block of blocks ) {
		if ( isMatch( block ) ) {
			return block;
		}
		const childResult = findBlock( block.innerBlocks, isMatch );
		if ( childResult ) {
			return childResult;
		}
	}
}

export default function useTemplatesFilteredByTemplatePart(
	templatePartSlug,
	templates
) {
	const [ result, setResult ] = useState( [] );
	// We are using a timeout and an effect just to make sure
	// the parsing of templates is done asynchronously and does not blocks
	// the rendering of the page.
	useEffect( () => {
		if ( ! templatePartSlug || ! templates ) {
			return;
		}
		const timeoutId = setTimeout( () => {
			setResult(
				templates.filter( ( template ) => {
					if ( template?.content?.raw ) {
						const blocks = parse( template.content.raw );
						return !! findBlock( blocks, ( block ) => {
							return (
								block.name === 'core/template-part' &&
								block.attributes.slug === templatePartSlug
							);
						} );
					}
					return false;
				} )
			);
		}, 0 );
		return () => {
			if ( timeoutId ) {
				clearTimeout( timeoutId );
			}
		};
	} );
	if ( ! templatePartSlug || ! templates ) {
		return templates;
	}
	return result;
}
