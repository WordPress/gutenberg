/**
 * External dependencies
 */
import { render, screen, fireEvent } from '@testing-library/react';

/**
 * Internal dependencies
 */
import ContentEditableControl from '..';

function getTextbox( container: HTMLElement ) {
	return container.querySelector(
		'.wp-components-content-editable-control'
	) as HTMLDivElement | null;
}

// The presentational shell is deliberately decoupled from `@wordpress/rich-text`:
// the editable behavior is injected by the consumer through the forwarded ref
// and `children`. These tests exercise only the chrome the shell owns -- the label,
// the `contentEditable` element, and the controlled focus/blur selection
// heuristic -- with no rich-text wiring at all.
describe( 'ContentEditableControl (presentational shell)', () => {
	it( 'renders a labeled contenteditable textbox', () => {
		const { container } = render(
			<ContentEditableControl label="Description" />
		);

		const textbox = getTextbox( container )!;
		const label = screen.getByText( 'Description' );

		expect( textbox ).toBeInTheDocument();
		expect( textbox ).toHaveAttribute( 'role', 'textbox' );
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

	it( 'forwards `disableLineBreaks` to the textbox via `aria-multiline`', () => {
		const { container, rerender } = render(
			<ContentEditableControl label="Single line" />
		);
		expect( getTextbox( container ) ).toHaveAttribute(
			'aria-multiline',
			'true'
		);

		rerender(
			<ContentEditableControl label="Single line" disableLineBreaks />
		);
		expect( getTextbox( container ) ).toHaveAttribute(
			'aria-multiline',
			'false'
		);
	} );

	it( 'uses a consumer-supplied `id` for the textbox and label', () => {
		const { container } = render(
			<ContentEditableControl
				label="Custom id"
				// eslint-disable-next-line no-restricted-syntax
				id="my-custom-id"
			/>
		);

		const textbox = getTextbox( container )!;
		expect( textbox ).toHaveAttribute( 'id', 'my-custom-id' );
		expect( screen.getByText( 'Custom id' ) ).toHaveAttribute(
			'for',
			'my-custom-id'
		);
	} );

	it( 'merges a consumer-supplied className with the control class', () => {
		const { container } = render(
			<ContentEditableControl
				label="Styled"
				className="my-custom-class"
			/>
		);

		const textbox = getTextbox( container )!;
		expect( textbox ).toHaveClass(
			'wp-components-content-editable-control'
		);
		expect( textbox ).toHaveClass( 'my-custom-class' );
	} );

	it( 'forwards additional native props to the textbox', () => {
		const { container } = render(
			<ContentEditableControl
				label="Note"
				dir="rtl"
				data-testid="my-textbox"
			/>
		);

		const textbox = getTextbox( container )!;
		expect( textbox ).toHaveAttribute( 'dir', 'rtl' );
		expect( textbox ).toHaveAttribute( 'data-testid', 'my-textbox' );
	} );

	it( 'forwards its ref to the contenteditable element', () => {
		// The rich-text wiring (the `useRichText` ref, event-listener refs,
		// an anchor ref, …) is injected through this forwarded ref.
		const ref = jest.fn();
		const { container } = render(
			<ContentEditableControl label="Note" ref={ ref } />
		);

		expect( ref ).toHaveBeenCalledWith( getTextbox( container ) );
	} );

	describe( 'selection', () => {
		// The shell derives selection directly from the focus/blur
		// transitions, usable both controlled (`isSelected`) and uncontrolled.
		// It deliberately has no knowledge of popovers: a consumer whose
		// format UI opens popovers controls `isSelected` and implements its
		// own blur handling (covered by the richtext DataForm control tests
		// in `@wordpress/dataviews`).
		it( 'mounts children only while selected (uncontrolled)', () => {
			const { container } = render(
				<ContentEditableControl label="Field">
					<span data-testid="assembly" />
				</ContentEditableControl>
			);
			const textbox = getTextbox( container )!;

			expect(
				screen.queryByTestId( 'assembly' )
			).not.toBeInTheDocument();

			fireEvent.focus( textbox );
			expect( screen.getByTestId( 'assembly' ) ).toBeInTheDocument();

			fireEvent.blur( textbox );
			expect(
				screen.queryByTestId( 'assembly' )
			).not.toBeInTheDocument();
		} );

		it( 'starts selected with `defaultIsSelected` (uncontrolled)', () => {
			render(
				<ContentEditableControl label="Field" defaultIsSelected>
					<span data-testid="assembly" />
				</ContentEditableControl>
			);

			expect( screen.getByTestId( 'assembly' ) ).toBeInTheDocument();
		} );

		it( 'defers to the `isSelected` prop when controlled', () => {
			const onSelectedChange = jest.fn();
			const { container, rerender } = render(
				<ContentEditableControl
					label="Field"
					isSelected={ false }
					onSelectedChange={ onSelectedChange }
				>
					<span data-testid="assembly" />
				</ContentEditableControl>
			);

			// Controlled: the shell requests the change but does not apply
			// it itself.
			fireEvent.focus( getTextbox( container )! );
			expect( onSelectedChange ).toHaveBeenCalledWith( true );
			expect(
				screen.queryByTestId( 'assembly' )
			).not.toBeInTheDocument();

			rerender(
				<ContentEditableControl
					label="Field"
					isSelected
					onSelectedChange={ onSelectedChange }
				>
					<span data-testid="assembly" />
				</ContentEditableControl>
			);
			expect( screen.getByTestId( 'assembly' ) ).toBeInTheDocument();
		} );

		it( 'reports selection on focus', () => {
			const onSelectedChange = jest.fn();
			const { container } = render(
				<ContentEditableControl
					label="Field"
					onSelectedChange={ onSelectedChange }
				/>
			);

			fireEvent.focus( getTextbox( container )! );
			expect( onSelectedChange ).toHaveBeenCalledWith( true );
		} );

		it( 'reports deselection on blur', () => {
			const onSelectedChange = jest.fn();
			const { container } = render(
				<ContentEditableControl
					label="Field"
					onSelectedChange={ onSelectedChange }
				/>
			);
			const textbox = getTextbox( container )!;

			fireEvent.focus( textbox );
			fireEvent.blur( textbox );

			expect( onSelectedChange ).toHaveBeenLastCalledWith( false );
		} );

		it( 'leaves selection to the consumer when controlled without `onSelectedChange`', () => {
			// A controlling consumer (e.g. the richtext DataForm control)
			// keeps the field selected through blur, so a popover its format
			// UI opened can claim focus without unmounting; the shell must
			// not fight the controlled value.
			const { container } = render(
				<ContentEditableControl label="Field" isSelected>
					<span data-testid="assembly" />
				</ContentEditableControl>
			);
			const textbox = getTextbox( container )!;

			fireEvent.focus( textbox );
			fireEvent.blur( textbox );

			expect( screen.getByTestId( 'assembly' ) ).toBeInTheDocument();
		} );

		it( 'calls consumer-supplied focus and blur handlers', () => {
			const onFocus = jest.fn();
			const onBlur = jest.fn();
			const { container } = render(
				<ContentEditableControl
					label="Field"
					onFocus={ onFocus }
					onBlur={ onBlur }
				/>
			);
			const textbox = getTextbox( container )!;

			fireEvent.focus( textbox );
			expect( onFocus ).toHaveBeenCalledTimes( 1 );

			fireEvent.blur( textbox );
			expect( onBlur ).toHaveBeenCalledTimes( 1 );
		} );
	} );
} );
