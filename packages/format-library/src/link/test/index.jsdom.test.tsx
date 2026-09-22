import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createRef } from '@wordpress/element';
import type { RichTextValue } from '@wordpress/rich-text';
import { link } from '../index';

vi.mock( import( '@wordpress/block-editor' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	RichTextShortcut: () => null,
	RichTextToolbarButton: () => null,
} ) );

const Edit = link.edit;

const emptyValue = {
	text: '',
	formats: [],
	replacements: [],
} as unknown as RichTextValue;

function mountEdit( html: string ) {
	const contentRef = createRef< HTMLDivElement >();

	render(
		<>
			<div
				ref={ contentRef }
				contentEditable
				suppressContentEditableWarning
				dangerouslySetInnerHTML={ { __html: html } }
			/>
			<Edit
				isActive={ false }
				activeAttributes={ {} }
				value={ emptyValue }
				onChange={ vi.fn() }
				onFocus={ vi.fn() }
				contentRef={ contentRef }
				isVisible={ false }
			/>
		</>
	);

	return contentRef;
}

describe( 'link format — invalid link indicator', () => {
	it( 'flags a link with an invalid href', () => {
		mountEdit( '<a href="htt#p://example.com">broken</a>' );

		const linkElement = screen.getByRole( 'link', { name: 'broken' } );
		expect( linkElement ).toHaveClass( 'is-format-link-invalid' );
		expect( linkElement ).toHaveAttribute( 'title' );
	} );

	it( 'does not flag a link with a valid href', () => {
		mountEdit( '<a href="https://example.com">fine</a>' );

		const linkElement = screen.getByRole( 'link', { name: 'fine' } );
		expect( linkElement ).not.toHaveClass( 'is-format-link-invalid' );
		expect( linkElement ).not.toHaveAttribute( 'title' );
	} );

	it( 'does not flag a valid same-page anchor link', () => {
		mountEdit( '<a href="#section-1">jump</a>' );

		const linkElement = screen.getByRole( 'link', { name: 'jump' } );
		expect( linkElement ).not.toHaveClass( 'is-format-link-invalid' );
	} );

	it( 'unflags a link once its href is fixed', () => {
		const contentRef = mountEdit(
			'<a href="htt#p://example.com">broken</a>'
		);

		const linkElementBeforeFix = screen.getByRole( 'link', {
			name: 'broken',
		} );
		expect( linkElementBeforeFix ).toHaveClass( 'is-format-link-invalid' );

		linkElementBeforeFix.setAttribute( 'href', 'https://example.com' );

		render(
			<Edit
				isActive={ false }
				activeAttributes={ {} }
				value={
					{
						text: 'changed',
						formats: [],
						replacements: [],
					} as unknown as RichTextValue
				}
				onChange={ vi.fn() }
				onFocus={ vi.fn() }
				contentRef={ contentRef }
				isVisible={ false }
			/>
		);

		const linkElement = screen.getByRole( 'link', { name: 'broken' } );
		expect( linkElement ).not.toHaveClass( 'is-format-link-invalid' );
		expect( linkElement ).not.toHaveAttribute( 'title' );
	} );
} );
