import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { applyFormat, create, useAnchor } from '@wordpress/rich-text';
import InlineColorUI from '../inline';

vi.mock( import( '@wordpress/rich-text' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useAnchor: vi.fn(),
} ) );

globalThis.wpVitest.mockMatchMedia();
globalThis.wpVitest.mockResizeObserver();

const format = 'core/text-color';
const warning = /This color combination may be hard for people to read\. Try/;

function renderPicker( style: string, fontSize = 16, virtualAnchor = false ) {
	const text = 'Highlighted text';
	render( <p style={ { fontSize } }>{ text }</p> );
	const editable = screen.getByText( text );
	vi.mocked( useAnchor ).mockReturnValue(
		virtualAnchor
			? {
					contextElement: editable,
					getBoundingClientRect: () =>
						editable.getBoundingClientRect(),
				}
			: editable
	);
	const value = applyFormat(
		{ ...create( { text } ), start: 0, end: text.length },
		{ type: format, attributes: { style } }
	);

	render(
		<InlineColorUI
			name={ format }
			property="backgroundColor"
			isActive
			value={ value }
			onChange={ vi.fn() }
			onClose={ vi.fn() }
			contentRef={ { current: editable } }
		/>
	);
	expect(
		screen.getByRole( 'button', { name: 'Clear' } )
	).toBeInTheDocument();
}

describe( 'Inline highlight contrast', () => {
	it( 'warns when the selected text and highlight colors are hard to read', async () => {
		renderPicker( 'color:#888888;background-color:#ffffff' );
		expect( await screen.findByText( warning ) ).toBeInTheDocument();
	} );

	it.each( [
		[ 'readable colors', 'color:#000000;background-color:#ffffff', 16 ],
		[ 'one explicit color', 'color:#888888', 16 ],
		[
			'a transparent highlight',
			'color:#888888;background-color:rgba(0, 0, 0, 0)',
			16,
		],
	] )( 'does not warn for %s', ( _label, style, fontSize ) => {
		renderPicker( style, fontSize );
		expect( screen.queryByText( warning ) ).not.toBeInTheDocument();
	} );

	it( 'uses the font size of a virtual anchor context element', () => {
		renderPicker( 'color:#888888;background-color:#ffffff', 24, true );
		expect( screen.queryByText( warning ) ).not.toBeInTheDocument();
	} );
} );
