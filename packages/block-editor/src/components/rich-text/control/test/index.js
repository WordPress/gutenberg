/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { unregisterFormatType, registerFormatType } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import RichTextControl from '../';

function getTextbox( container ) {
	return container.querySelector( '.block-editor-rich-text-control' );
}

describe( 'RichTextControl', () => {
	beforeAll( () => {
		// Register a minimal stub for `core/bold` so the optional
		// `allowedFormats` codepath has something to resolve when exercised.
		registerFormatType( 'core/bold', {
			title: 'Bold',
			tagName: 'strong',
			className: null,
			edit: () => null,
		} );
	} );

	afterAll( () => {
		unregisterFormatType( 'core/bold' );
	} );

	it( 'renders a labeled contenteditable textbox', () => {
		const { container } = render(
			<RichTextControl
				label="Description"
				value=""
				onChange={ () => {} }
			/>
		);

		const textbox = getTextbox( container );
		const label = screen.getByText( 'Description' );

		expect( textbox ).toBeInTheDocument();
		expect( textbox ).toHaveAttribute( 'role', 'textbox' );
		expect( textbox ).toHaveAttribute( 'contenteditable', 'true' );
		// `BaseControl` wires the label's `for` to the control's `id`.
		expect( label ).toHaveAttribute( 'for', textbox.id );
	} );

	it( 'visually hides the label when `hideLabelFromVision` is set', () => {
		render(
			<RichTextControl
				label="Note"
				value=""
				onChange={ () => {} }
				hideLabelFromVision
			/>
		);

		const label = screen.getByText( 'Note' );
		// `BaseControl` applies the `components-visually-hidden` class to its
		// label when `hideLabelFromVision` is true.
		expect( label ).toHaveClass( 'components-visually-hidden' );
	} );

	it( 'forwards `disableLineBreaks` to the textbox via `aria-multiline`', () => {
		const { container, rerender } = render(
			<RichTextControl
				label="Single line"
				value=""
				onChange={ () => {} }
			/>
		);
		expect( getTextbox( container ) ).toHaveAttribute(
			'aria-multiline',
			'true'
		);

		rerender(
			<RichTextControl
				label="Single line"
				value=""
				onChange={ () => {} }
				disableLineBreaks
			/>
		);
		expect( getTextbox( container ) ).toHaveAttribute(
			'aria-multiline',
			'false'
		);
	} );

	it( 'merges a consumer-supplied className with the control class', () => {
		const { container } = render(
			<RichTextControl
				label="Styled"
				value=""
				onChange={ () => {} }
				className="my-custom-class"
			/>
		);

		const textbox = getTextbox( container );
		expect( textbox ).toHaveClass( 'block-editor-rich-text-control' );
		expect( textbox ).toHaveClass( 'my-custom-class' );
	} );
} );
