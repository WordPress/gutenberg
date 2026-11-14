import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { applyFormat, create, useAnchor } from '@wordpress/rich-text';
import InlineColorUI from '../inline';

vi.mock( import( '@wordpress/rich-text' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useAnchor: vi.fn(),
} ) );

afterEach( cleanup );

const format = 'core/text-color';
const warning = /This color combination may be hard for people to read\. Try/;

async function renderPicker(
	style: string,
	fontSize = 16,
	virtualAnchor = false
) {
	const text = 'Highlighted text';
	await render( <p style={ { fontSize } }>{ text }</p> );
	const editable = page.getByText( text ).element() as HTMLElement;
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

	await render(
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
	await expect
		.element( page.getByRole( 'button', { name: 'Clear' } ) )
		.toBeInTheDocument();
}

describe( 'Inline highlight contrast', () => {
	it( 'warns when the selected text and highlight colors are hard to read', async () => {
		await renderPicker( 'color:#888888;background-color:#ffffff' );
		await expect.element( page.getByText( warning ) ).toBeInTheDocument();
	} );

	it.each( [
		[ 'readable colors', 'color:#000000;background-color:#ffffff', 16 ],
		[ 'one explicit color', 'color:#888888', 16 ],
		[
			'a transparent highlight',
			'color:#888888;background-color:rgba(0, 0, 0, 0)',
			16,
		],
	] )( 'does not warn for %s', async ( _label, style, fontSize ) => {
		await renderPicker( style, fontSize );
		await expect
			.element( page.getByText( warning ) )
			.not.toBeInTheDocument();
	} );

	it( 'uses the font size of a virtual anchor context element', async () => {
		await renderPicker(
			'color:#888888;background-color:#ffffff',
			24,
			true
		);
		await expect
			.element( page.getByText( warning ) )
			.not.toBeInTheDocument();
	} );
} );
