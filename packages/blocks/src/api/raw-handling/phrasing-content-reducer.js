/**
 * External dependencies
 */
import { identity, includes } from 'lodash';

/**
 * WordPress dependencies
 */
import { wrap, replaceTag } from '@wordpress/dom';

const getSemanticTags = ( { node } ) => {
	const {
		fontWeight,
		fontStyle,
		textDecorationLine,
		textDecoration,
		verticalAlign,
	} = node.style;
	const tags = [];
	if ( fontWeight === 'bold' || fontWeight === '700' ) {
		tags.push( 'strong' );
	}

	if ( fontStyle === 'italic' ) {
		tags.push( 'em' );
	}

	// Some DOM implementations (Safari, JSDom) don't support
	// style.textDecorationLine, so we check style.textDecoration as a
	// fallback.
	if (
		textDecorationLine === 'line-through' ||
		includes( textDecoration, 'line-through' )
	) {
		tags.push( 's' );
	}

	if ( verticalAlign === 'super' ) {
		tags.push( 'sup' );
	} else if ( verticalAlign === 'sub' ) {
		tags.push( 'sub' );
	}
	return tags;
};

const handleSpan = ( { node, doc } ) => {
	const semanticTagsToWrap = getSemanticTags( node );
	semanticTagsToWrap.forEach( ( tag ) =>
		wrap( doc.createElement( tag ), node )
	);
};
const handleBold = ( { node } ) => replaceTag( node, 'strong' );
const handleItalic = ( { node } ) => replaceTag( node, 'italic' );
const handleAnchor = ( { node } ) => {
	// In jsdom-jscore, 'node.target' can be null.
	// TODO: Explore fixing this by patching jsdom-jscore.
	if ( node.target && node.target.toLowerCase() === '_blank' ) {
		node.rel = 'noreferrer noopener';
	} else {
		node.removeAttribute( 'target' );
		node.removeAttribute( 'rel' );
	}
};

const elementNameToHandlerMapper = {
	span: handleSpan,
	B: handleBold,
	I: handleItalic,
	A: handleAnchor,
};

export default function phrasingContentReducer( node, doc ) {
	// In jsdom-jscore, 'node.style' can be null.
	// TODO: Explore fixing this by patching jsdom-jscore.
	const elementType = node.nodeName;
	const elementHandler =
		elementNameToHandlerMapper[ elementType ] || identity;
	elementHandler( { node, doc } );
}
