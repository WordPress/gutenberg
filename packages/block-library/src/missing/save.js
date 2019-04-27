/**
 * WordPress dependencies
 */
import { blockTraverser } from '@wordpress/blocks';
import { RawHTML } from '@wordpress/element';

const blockToSave = blockTraverser(
	( a, b ) => a.concat( b ),
	[],
	( content, recurse ) => {
		if ( 'string' === typeof content ) {
			return content;
		}

		const { attributes: { parsedBlock } } = content;
		const opener = `<!-- wp:${ parsedBlock.name } ${ JSON.stringify( parsedBlock.attributes ) } -->`;
		const inside = recurse( parsedBlock ).join( '\n' );
		const closer = `<!-- /wp:${ parsedBlock.name } -->`;

		return opener + inside + closer;
	}
);

export default function save( { attributes: { parsedBlock } } ) {
	// Preserve the missing block's content.
	const opener = `<!-- wp:${ parsedBlock.name } ${ JSON.stringify( parsedBlock.attributes ) } -->`;
	const closer = `<!-- /wp:${ parsedBlock.name } -->`;

	return <RawHTML>{ opener + blockToSave( parsedBlock ).join( '\n' ) + closer }</RawHTML>;
}
