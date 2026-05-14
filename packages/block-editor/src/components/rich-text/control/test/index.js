/**
 * External dependencies
 */
import { render, screen, fireEvent, act } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { unregisterFormatType, registerFormatType } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import RichTextControl from '../';
import { RichTextShortcut } from '../../shortcut';

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
		// `<label for>` does not contribute an accessible name to a non-form
		// element (a `<div role="textbox">`), so the label is also mirrored
		// onto `aria-label` for assistive tech and test locators.
		expect( textbox ).toHaveAttribute( 'aria-label', 'Description' );
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

	describe( 'keyboard shortcuts', () => {
		// Hold the latest `onUse` mock in a closure-captured ref so the
		// format type can be registered once in `beforeAll` (avoiding store
		// updates during render that would re-fire `useSelect` outside
		// `act(...)`), while each test can still assert on a fresh mock.
		let currentOnUse;

		beforeAll( () => {
			registerFormatType( 'core/test-shortcut', {
				title: 'Test Shortcut',
				tagName: 'mark',
				className: null,
				edit: () => (
					<RichTextShortcut
						type="primary"
						character="b"
						onUse={ () => currentOnUse() }
					/>
				),
			} );
		} );

		afterAll( () => {
			unregisterFormatType( 'core/test-shortcut' );
		} );

		beforeEach( () => {
			currentOnUse = jest.fn();
		} );

		// `useRichText` schedules a selection sync via `queueMicrotask` when
		// focus enters the editable, which fires a `setSelection`-driven
		// re-render of `RichTextControl`. Flush that microtask inside an
		// `act` block so React doesn't warn about updates outside `act(...)`.
		const flushMicrotasks = () =>
			act( async () => {
				await Promise.resolve();
			} );

		async function focusTextbox( textbox ) {
			fireEvent.focus( textbox );
			await flushMicrotasks();
		}

		async function blurTextbox( textbox ) {
			fireEvent.blur( textbox );
			await flushMicrotasks();
		}

		// Dispatch a `primary+b` keydown — on non-Apple platforms (jsdom's
		// default), the `primary` modifier maps to Ctrl, not Meta.
		function dispatchPrimaryB( textbox ) {
			return fireEvent.keyDown( textbox, {
				key: 'b',
				code: 'KeyB',
				ctrlKey: true,
			} );
		}

		it( 'dispatches registered format shortcuts on keydown when focused', async () => {
			const { container } = render(
				<RichTextControl
					label="Shortcut"
					value=""
					onChange={ () => {} }
				/>
			);
			const textbox = getTextbox( container );

			await focusTextbox( textbox );

			// `fireEvent.keyDown` returns `false` when the dispatched event
			// had `preventDefault()` called on it.
			const dispatched = dispatchPrimaryB( textbox );

			expect( currentOnUse ).toHaveBeenCalledTimes( 1 );
			// `RichTextShortcut` calls `preventDefault()` so global Cmd+K
			// (the command palette, which bails on `defaultPrevented`) does
			// not fire when the link format consumes it.
			expect( dispatched ).toBe( false );
		} );

		it( 'does not dispatch shortcuts while unfocused', () => {
			const { container } = render(
				<RichTextControl
					label="Shortcut"
					value=""
					onChange={ () => {} }
				/>
			);
			const textbox = getTextbox( container );

			dispatchPrimaryB( textbox );
			expect( currentOnUse ).not.toHaveBeenCalled();
		} );

		it( 'stops dispatching shortcuts after blur', async () => {
			const { container } = render(
				<RichTextControl
					label="Shortcut blur"
					value=""
					onChange={ () => {} }
				/>
			);
			const textbox = getTextbox( container );

			await focusTextbox( textbox );
			await blurTextbox( textbox );

			dispatchPrimaryB( textbox );
			expect( currentOnUse ).not.toHaveBeenCalled();
		} );
	} );
} );
