/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

const transforms = {
	from: [
		{
			type: 'raw',
			isMatch: ( node ) => {
				// Match <p> containing only a <math display="block"> element
				if ( node.nodeName !== 'P' ) {
					return false;
				}
				// Filter out whitespace-only text nodes
				const children = Array.from( node.childNodes ).filter(
					( child ) =>
						child.nodeType !== 3 || child.textContent.trim()
				);
				if ( children.length !== 1 ) {
					return false;
				}
				const child = children[ 0 ];
				// nodeName is uppercase for HTML, but check both cases for safety
				const nodeName = child.nodeName.toUpperCase();
				return (
					nodeName === 'MATH' &&
					child.getAttribute( 'display' ) === 'block'
				);
			},
			transform: ( node ) => {
				const mathElement = node.querySelector(
					'math[display="block"]'
				);
				const latex = mathElement?.getAttribute( 'data-latex' ) || '';
				return createBlock( 'core/math', { latex } );
			},
			priority: 5, // Higher priority than paragraph
		},
	],
};

export default transforms;
