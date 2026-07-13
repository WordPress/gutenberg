/**
 * External dependencies
 */
import { render, screen, fireEvent } from '@testing-library/react';

/**
 * Internal dependencies
 */
import ContentEditableControl from '..';

// The presentational shell is deliberately decoupled from `@wordpress/rich-text`:
// the editable behavior and any focus/selection tracking are owned by the
// consumer, wired through the forwarded ref and native event props. These
// tests exercise only the chrome the shell owns -- the label and the
// `contentEditable` element -- with no rich-text wiring at all.
describe( 'ContentEditableControl', () => {
	it( 'renders a labeled contenteditable textbox', () => {
		render( <ContentEditableControl label="Description" /> );

		const textbox = screen.getByRole( 'textbox' );
		const label = screen.getByText( 'Description' );

		expect( textbox ).toHaveAttribute( 'contenteditable', 'true' );
		// `BaseControl` wires the label's `for` to the control's `id`.
		expect( label ).toHaveAttribute( 'for', textbox.id );
		// `<label for>` does not contribute an accessible name to a non-form
		// element (a `<div role="textbox">`), so the label is also mirrored
		// onto `aria-label` for assistive tech and test locators.
		expect( textbox ).toHaveAttribute( 'aria-label', 'Description' );
	} );

	it( 'visually hides the label when `hideLabelFromVision` is set', () => {
		render( <ContentEditableControl label="Note" hideLabelFromVision /> );

		const label = screen.getByText( 'Note' );
		expect( label ).toHaveClass( 'components-visually-hidden' );
	} );

	it( 'is multiline by default and accepts an `aria-multiline` override', () => {
		const { rerender } = render(
			<ContentEditableControl label="Single line" />
		);
		expect( screen.getByRole( 'textbox' ) ).toHaveAttribute(
			'aria-multiline',
			'true'
		);

		rerender(
			<ContentEditableControl
				label="Single line"
				aria-multiline={ false }
			/>
		);
		expect( screen.getByRole( 'textbox' ) ).toHaveAttribute(
			'aria-multiline',
			'false'
		);
	} );

	it( 'exposes `disabled` as a non-editable, aria-disabled textbox', () => {
		render( <ContentEditableControl label="Note" disabled /> );

		const textbox = screen.getByRole( 'textbox' );
		expect( textbox ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( textbox ).toHaveAttribute( 'contenteditable', 'false' );
	} );

	it( 'exposes `required` via aria-required', () => {
		render( <ContentEditableControl label="Note" required /> );

		expect( screen.getByRole( 'textbox' ) ).toBeRequired();
	} );

	it( 'exposes `placeholder` via aria-placeholder', () => {
		render(
			<ContentEditableControl label="Note" placeholder="Add a note…" />
		);

		expect( screen.getByRole( 'textbox' ) ).toHaveAttribute(
			'aria-placeholder',
			'Add a note…'
		);
	} );

	it( 'uses a consumer-supplied `id` for the textbox and label', () => {
		render(
			<ContentEditableControl
				label="Custom id"
				// eslint-disable-next-line no-restricted-syntax
				id="my-custom-id"
			/>
		);

		expect( screen.getByRole( 'textbox' ) ).toHaveAttribute(
			'id',
			'my-custom-id'
		);
		expect( screen.getByText( 'Custom id' ) ).toHaveAttribute(
			'for',
			'my-custom-id'
		);
	} );

	it( 'applies a consumer-supplied className to the outermost wrapper', () => {
		const { container } = render(
			<ContentEditableControl
				label="Styled"
				className="my-custom-class"
			/>
		);

		// The package convention is to put the consumer's `className` on the
		// outermost wrapper (the `BaseControl` root), not the editable.
		expect(
			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			container.querySelector( '.components-base-control' )
		).toHaveClass( 'my-custom-class' );
		expect( screen.getByRole( 'textbox' ) ).not.toHaveClass(
			'my-custom-class'
		);
	} );

	it( 'forwards additional native props to the textbox', () => {
		render(
			<ContentEditableControl
				label="Note"
				dir="rtl"
				data-testid="my-textbox"
			/>
		);

		const textbox = screen.getByRole( 'textbox' );
		expect( textbox ).toHaveAttribute( 'dir', 'rtl' );
		expect( textbox ).toHaveAttribute( 'data-testid', 'my-textbox' );
	} );

	it( 'forwards its ref to the contenteditable element', () => {
		// The rich-text wiring (the `useRichText` ref, event-listener refs,
		// an anchor ref, …) is injected through this forwarded ref.
		const ref = jest.fn();
		render( <ContentEditableControl label="Note" ref={ ref } /> );

		expect( ref ).toHaveBeenCalledWith( screen.getByRole( 'textbox' ) );
	} );

	it( 'calls consumer-supplied focus and blur handlers', () => {
		const onFocus = jest.fn();
		const onBlur = jest.fn();
		render(
			<ContentEditableControl
				label="Field"
				onFocus={ onFocus }
				onBlur={ onBlur }
			/>
		);
		const textbox = screen.getByRole( 'textbox' );

		fireEvent.focus( textbox );
		expect( onFocus ).toHaveBeenCalledTimes( 1 );

		fireEvent.blur( textbox );
		expect( onBlur ).toHaveBeenCalledTimes( 1 );
	} );
} );
