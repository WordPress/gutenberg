/**
 * Internal dependencies
 */
import { toggleRichText } from '../use-multi-selection';

describe( 'toggleRichText', () => {
	function getContainer( isContentEditible ) {
		const container = document.createDocumentFragment();
		[
			'rich-text',
			'rich-text editor-post-title__input',
			'some-other-class',
		].forEach( ( className ) => {
			const element = document.createElement( 'div' );
			element.setAttribute( 'class', className );
			if ( isContentEditible ) {
				element.setAttribute( 'contenteditable', true );
			}
			container.appendChild( element );
		} );
		return container;
	}

	it( 'should set the `contenteditable` attribute on eligible rich text nodes', () => {
		const container = getContainer();
		toggleRichText( container, true );
		let nodes = container.querySelectorAll( '[contenteditable=true]' );

		expect( nodes ).toHaveLength( 1 );
		expect( nodes[ 0 ].className ).toBe( 'rich-text' );

		toggleRichText( container, false );
		nodes = container.querySelectorAll( '[contenteditable=true]' );
		expect( nodes ).toHaveLength( 0 );
	} );
} );
