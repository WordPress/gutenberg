/**
 * WordPress dependencies
 */
import { createBlock, getLatexToMathML } from '@wordpress/blocks';

const transforms = {
	from: [
		{
			type: 'raw',
			isMatch: ( node ) => {
				// Match bare <math display="block">
				if (
					node.nodeName.toUpperCase() === 'MATH' &&
					node.getAttribute( 'display' ) === 'block'
				) {
					return true;
				}
				// Match <p> containing only <math display="block">
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
				return (
					child.nodeName.toUpperCase() === 'MATH' &&
					child.getAttribute( 'display' ) === 'block'
				);
			},
			transform: ( node ) => {
				const mathElement =
					node.nodeName.toUpperCase() === 'MATH'
						? node
						: node.querySelector( 'math[display="block"]' );
				const latex = mathElement?.getAttribute( 'data-latex' ) || '';
				let mathML = '';
				const latexToMathML = getLatexToMathML();
				if ( latexToMathML ) {
					try {
						mathML = latexToMathML( latex, { displayMode: true } );
					} catch ( e ) {
						// Leave empty on error - editor will retry
					}
				}
				return createBlock( 'core/math', { latex, mathML } );
			},
			priority: 5, // Higher priority than paragraph
		},
	],
};

export default transforms;
