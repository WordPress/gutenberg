/**
 * WordPress dependencies
 */
import { RawHTML } from '@wordpress/element';

const blockTraverser = ( combiner, initialValue, reducer ) => {
	const recurse = ( block ) => block.innerContent.reduce(
		( [ accumulator, blockIndex ], content ) => (
			null === content ?
				[ combiner( accumulator, reducer( block.innerBlocks[ blockIndex ], recurse ) ), blockIndex + 1 ] :
				[ combiner( accumulator, reducer( content, recurse ) ), blockIndex ]
		),
		[ initialValue, 0 ]
	)[ 0 ];

	return recurse;
};

const blockToSave = blockTraverser(
	( a, b ) => a.concat( b ),
	[],
	( content, recurse ) => {
		if ( 'string' === typeof content ) {
			return content;
		}

		return `<!-- wp:${ content.name } ${ JSON.stringify( content.attributes ) } -->${ recurse( content ).join( '\n' ) }<!-- /wp:${ content.name } -->`;
	}
);

export default function save( { attributes: {
	originalName: name,
	originalAttributes: attributes,
	originalInnerBlocks: innerBlocks,
	originalInnerContent: innerContent,
} } ) {
	// Preserve the missing block's content.
	return <RawHTML>{ `<!-- wp:${ name } ${ JSON.stringify( attributes ) } -->${ blockToSave( { name, attributes, innerBlocks, innerContent } ).join( '\n' ) }<!-- /wp:${ name } -->` }</RawHTML>;
}
