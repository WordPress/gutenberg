import { render, screen } from '@testing-library/react';
import { createElement } from '@wordpress/element';
import { describe, expect, it } from 'vitest';
import BlockCompare from '../';

const noop = () => {};

/**
 * Creates the block the convertor returns: a Custom HTML block, whose markup
 * lives in `innerContent` rather than being produced by `save`.
 *
 * @param {string} html Block markup.
 * @return {Object} Block object.
 */
function createHTMLBlock( html ) {
	return {
		clientId: 'converted',
		name: 'core/html',
		attributes: {},
		innerBlocks: [],
		innerContent: [ html ],
		isValid: true,
	};
}

function renderCompare( originalContent, convertedBlock ) {
	render(
		createElement( BlockCompare, {
			block: { originalContent },
			onKeep: noop,
			onConvert: noop,
			convertor: () => convertedBlock,
			convertButtonText: 'Convert to Blocks',
		} )
	);
}

// Keeps whitespace, which Testing Library collapses by default.
const keepWhitespace = ( text ) => text;

describe( 'BlockCompare', () => {
	it( 'shows the markup and preview of a converted Custom HTML block', () => {
		const html = '<div class="wp-block-test">Hello</div>';
		renderCompare( html, createHTMLBlock( html ) );

		// The markup reads the same in both columns, with nothing removed from
		// the diff, and both previews render it.
		const markup = screen.getAllByText( html );
		expect( markup ).toHaveLength( 2 );
		markup.forEach( ( part ) => {
			expect( part ).not.toHaveClass(
				'block-editor-block-compare__removed'
			);
		} );
		expect( screen.getAllByText( 'Hello' ) ).toHaveLength( 2 );
	} );

	it( 'marks each removed newline, so a difference made of blank lines is visible', () => {
		const originalContent = '<div>\n\n<span></span>\n\n</div>';
		renderCompare(
			originalContent,
			createHTMLBlock( '<div>\n<span></span>\n</div>' )
		);

		const markers = screen.getAllByText( '↵' );
		expect( markers ).toHaveLength( 2 );
		markers.forEach( ( marker ) => {
			expect( marker ).toHaveAttribute( 'aria-hidden', 'true' );
			// eslint-disable-next-line testing-library/no-node-access -- The diff parts are plain spans with no role or text of their own.
			expect( marker.parentElement ).toHaveClass(
				'block-editor-block-compare__removed'
			);
		} );

		// The current markup is shown verbatim, whitespace included.
		expect(
			screen.getByText( originalContent, { normalizer: keepWhitespace } )
		).toBeVisible();
	} );

	it( 'marks an added newline without touching unchanged text', () => {
		renderCompare(
			'<p>Hello</p><p>World</p>',
			createHTMLBlock( '<p>Hello</p>\n<p>World</p>' )
		);

		const marker = screen.getByText( '↵' );
		// eslint-disable-next-line testing-library/no-node-access -- The diff parts are plain spans with no role or text of their own.
		expect( marker.parentElement ).toHaveClass(
			'block-editor-block-compare__added'
		);
		expect( screen.getByText( '<p>Hello</p>' ) ).not.toHaveClass(
			'block-editor-block-compare__added'
		);
	} );
} );
