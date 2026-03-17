/**
 * External dependencies
 */
import {
	getEditorHtml,
	getEditorTitle,
	initializeEditor,
	pasteIntoRichText,
	selectRangeInRichText,
	screen,
	setupCoreBlocks,
	within,
} from 'test/helpers';

setupCoreBlocks();

const HTML_MULTIPLE_TAGS = `<h2>Howdy</h2>
<h2>This is a heading.</h2>
<p>This is a paragraph.</p>`;

describe( 'PostTitle', () => {
	it( 'populates empty title with first block content when pasting HTML', async () => {
		await initializeEditor( { initialTitle: '' } );

		const postTitle = within(
			screen.getByTestId( 'post-title' )
		).getByPlaceholderText( 'Add title' );
		pasteIntoRichText( postTitle, { html: HTML_MULTIPLE_TAGS } );

		expect( console ).toHaveLogged();
		expect( getEditorTitle() ).toBe( 'Howdy' );
		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'does not update title with existing content when pasting HTML', async () => {
		const initialTitle = 'Hello';
		await initializeEditor( { initialTitle } );

		const postTitle = within(
			screen.getByTestId( 'post-title' )
		).getByPlaceholderText( 'Add title' );
		selectRangeInRichText( postTitle, 0 );
		pasteIntoRichText( postTitle, { html: HTML_MULTIPLE_TAGS } );

		expect( console ).toHaveLogged();
		expect( getEditorTitle() ).toBe( initialTitle );
		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'updates title with existing content when pasting text', async () => {
		await initializeEditor( { initialTitle: 'World' } );

		const postTitle = within(
			screen.getByTestId( 'post-title' )
		).getByPlaceholderText( 'Add title' );
		selectRangeInRichText( postTitle, 0 );
		pasteIntoRichText( postTitle, { text: 'Hello' } );

		expect( console ).toHaveLogged();
		expect( getEditorTitle() ).toBe( 'HelloWorld' );
		expect( getEditorHtml() ).toBe( '' );
	} );

	it( 'does not add HTML to title when pasting span tag', async () => {
		const pasteHTML = `<span style="border: 1px solid black">l</span>`;
		await initializeEditor( { initialTitle: 'Helo' } );

		const postTitle = within(
			screen.getByTestId( 'post-title' )
		).getByPlaceholderText( 'Add title' );
		selectRangeInRichText( postTitle, 2 );
		pasteIntoRichText( postTitle, { html: pasteHTML } );

		expect( console ).toHaveLogged();
		expect( getEditorTitle() ).toBe( 'Hello' );
		expect( getEditorHtml() ).toBe( '' );
	} );
} );
