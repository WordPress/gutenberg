/**
 * External dependencies
 */
import { render, screen, fireEvent, act } from '@testing-library/react';

/**
 * Internal dependencies
 */
import RichTextControl from '..';

function getTextbox( container: HTMLElement ) {
	return container.querySelector(
		'.wp-rich-text-control'
	) as HTMLDivElement | null;
}

// The presentational shell is deliberately decoupled from `@wordpress/rich-text`:
// the editable behavior is injected by the consumer through the forwarded ref
// and `children`. These tests exercise only the chrome the shell owns -- the label,
// the `contentEditable` element, and the controlled focus/blur selection
// heuristic -- with no rich-text wiring at all.
describe( 'RichTextControl (presentational shell)', () => {
	it( 'renders a labeled contenteditable textbox', () => {
		const { container } = render( <RichTextControl label="Description" /> );

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
		render( <RichTextControl label="Note" hideLabelFromVision /> );

		const label = screen.getByText( 'Note' );
		expect( label ).toHaveClass( 'components-visually-hidden' );
	} );

	it( 'forwards `disableLineBreaks` to the textbox via `aria-multiline`', () => {
		const { container, rerender } = render(
			<RichTextControl label="Single line" />
		);
		expect( getTextbox( container ) ).toHaveAttribute(
			'aria-multiline',
			'true'
		);

		rerender( <RichTextControl label="Single line" disableLineBreaks /> );
		expect( getTextbox( container ) ).toHaveAttribute(
			'aria-multiline',
			'false'
		);
	} );

	it( 'uses a consumer-supplied `id` for the textbox and label', () => {
		const { container } = render(
			<RichTextControl
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
			<RichTextControl label="Styled" className="my-custom-class" />
		);

		const textbox = getTextbox( container )!;
		expect( textbox ).toHaveClass( 'wp-rich-text-control' );
		expect( textbox ).toHaveClass( 'my-custom-class' );
	} );

	it( 'forwards additional native props to the textbox', () => {
		const { container } = render(
			<RichTextControl label="Note" dir="rtl" data-testid="my-textbox" />
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
			<RichTextControl label="Note" ref={ ref } />
		);

		expect( ref ).toHaveBeenCalledWith( getTextbox( container ) );
	} );

	describe( 'selection', () => {
		// The shell derives selection from the focus/blur transitions, usable
		// both controlled (`isSelected`) and uncontrolled. Blur is deferred via
		// a 0ms `setTimeout` so a portal-rendered popover (e.g. the inline link
		// UI) can claim focus before the consumer's `FormatEdit` -- and
		// therefore the popover -- unmounts.
		async function flushBlurTimer() {
			await act( async () => {
				await new Promise( ( resolve ) => setTimeout( resolve, 0 ) );
			} );
		}

		it( 'mounts children only while selected (uncontrolled)', async () => {
			const { container } = render(
				<RichTextControl label="Field">
					<span data-testid="assembly" />
				</RichTextControl>
			);
			const textbox = getTextbox( container )!;

			expect(
				screen.queryByTestId( 'assembly' )
			).not.toBeInTheDocument();

			fireEvent.focus( textbox );
			expect( screen.getByTestId( 'assembly' ) ).toBeInTheDocument();

			fireEvent.blur( textbox );
			await flushBlurTimer();
			expect(
				screen.queryByTestId( 'assembly' )
			).not.toBeInTheDocument();
		} );

		it( 'starts selected with `defaultIsSelected` (uncontrolled)', () => {
			render(
				<RichTextControl label="Field" defaultIsSelected>
					<span data-testid="assembly" />
				</RichTextControl>
			);

			expect( screen.getByTestId( 'assembly' ) ).toBeInTheDocument();
		} );

		it( 'defers to the `isSelected` prop when controlled', () => {
			const onSelectedChange = jest.fn();
			const { container, rerender } = render(
				<RichTextControl
					label="Field"
					isSelected={ false }
					onSelectedChange={ onSelectedChange }
				>
					<span data-testid="assembly" />
				</RichTextControl>
			);

			// Controlled: the shell requests the change but does not apply
			// it itself.
			fireEvent.focus( getTextbox( container )! );
			expect( onSelectedChange ).toHaveBeenCalledWith( true );
			expect(
				screen.queryByTestId( 'assembly' )
			).not.toBeInTheDocument();

			rerender(
				<RichTextControl
					label="Field"
					isSelected
					onSelectedChange={ onSelectedChange }
				>
					<span data-testid="assembly" />
				</RichTextControl>
			);
			expect( screen.getByTestId( 'assembly' ) ).toBeInTheDocument();
		} );

		it( 'reports selection on focus', () => {
			const onSelectedChange = jest.fn();
			const { container } = render(
				<RichTextControl
					label="Field"
					onSelectedChange={ onSelectedChange }
				/>
			);

			fireEvent.focus( getTextbox( container )! );
			expect( onSelectedChange ).toHaveBeenCalledWith( true );
		} );

		it( 'reports deselection on blur to nowhere', async () => {
			const onSelectedChange = jest.fn();
			const { container } = render(
				<RichTextControl
					label="Field"
					onSelectedChange={ onSelectedChange }
				/>
			);
			const textbox = getTextbox( container )!;

			fireEvent.focus( textbox );
			fireEvent.blur( textbox );
			await flushBlurTimer();

			expect( onSelectedChange ).toHaveBeenLastCalledWith( false );
		} );

		// Focus the textbox, move focus into the supplied stand-in element,
		// then blur the textbox and flush the deferred deselection timer.
		async function blurWithFocusIn(
			textbox: HTMLElement,
			button: HTMLElement
		) {
			fireEvent.focus( textbox );
			button.focus();
			fireEvent.blur( textbox );
			await flushBlurTimer();
		}

		it( 'stays selected when focus moves into the control popover slot', async () => {
			const onSelectedChange = jest.fn();
			const { container } = render(
				<>
					<RichTextControl
						label="Field"
						onSelectedChange={ onSelectedChange }
					/>
					{ /* Stand-in for the inline link UI popover, which the
					   control scopes into its own slot, marked with this
					   attribute. */ }
					<div data-rich-text-control-popover-slot>
						<button type="button">Inside popover</button>
					</div>
				</>
			);

			await blurWithFocusIn(
				getTextbox( container )!,
				screen.getByRole( 'button', { name: 'Inside popover' } )
			);

			expect( onSelectedChange ).not.toHaveBeenCalledWith( false );
		} );

		it( 'stays selected when focus moves into a `@wordpress/ui` compat overlay', async () => {
			const onSelectedChange = jest.fn();
			const { container } = render(
				<>
					<RichTextControl
						label="Field"
						onSelectedChange={ onSelectedChange }
					/>
					{ /* Stand-in for a popover migrated to `@wordpress/ui`,
					   which portals into the shared compat overlay slot. */ }
					<div data-wp-compat-overlay-slot>
						<button type="button">Inside overlay</button>
					</div>
				</>
			);

			await blurWithFocusIn(
				getTextbox( container )!,
				screen.getByRole( 'button', { name: 'Inside overlay' } )
			);

			expect( onSelectedChange ).not.toHaveBeenCalledWith( false );
		} );

		it( 'deselects once focus leaves the control popover for elsewhere', async () => {
			const onSelectedChange = jest.fn();
			const { container } = render(
				<>
					<RichTextControl
						label="Field"
						onSelectedChange={ onSelectedChange }
					/>
					<div data-rich-text-control-popover-slot>
						<button type="button">Inside popover</button>
					</div>
					<button type="button">Outside</button>
				</>
			);
			const popoverButton = screen.getByRole( 'button', {
				name: 'Inside popover',
			} );

			await blurWithFocusIn( getTextbox( container )!, popoverButton );
			expect( onSelectedChange ).not.toHaveBeenCalledWith( false );

			/*
			 * Focus now leaves the popover for an element that belongs to
			 * neither the field nor its popovers. The field's own `onBlur`
			 * already fired, so this exercises the document-level focus
			 * tracking that takes over during the popover excursion.
			 */
			screen.getByRole( 'button', { name: 'Outside' } ).focus();
			fireEvent.focusOut( popoverButton );
			await flushBlurTimer();

			expect( onSelectedChange ).toHaveBeenLastCalledWith( false );
		} );

		it( 'deselects when focus moves to an unrelated popover', async () => {
			const onSelectedChange = jest.fn();
			const { container } = render(
				<>
					<RichTextControl
						label="Field"
						onSelectedChange={ onSelectedChange }
					/>
					{ /* A popover this control did not open: generic
					   `.components-popover` but none of the control's slot
					   markers, so it must not keep the field selected. */ }
					<div className="components-popover">
						<button type="button">Unrelated popover</button>
					</div>
				</>
			);

			await blurWithFocusIn(
				getTextbox( container )!,
				screen.getByRole( 'button', { name: 'Unrelated popover' } )
			);

			expect( onSelectedChange ).toHaveBeenLastCalledWith( false );
		} );
	} );
} );
