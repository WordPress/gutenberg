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
import RichTextControl from '../control';
import { unlock } from '../../../../lock-unlock';

function getTextbox( container ) {
	return container.querySelector( '.wp-rich-text-control' );
}

/*
 * `useRichText` schedules a selection sync via `queueMicrotask` when focus
 * enters the editable, which fires a `setSelection`-driven re-render of
 * `RichTextControl`. Flush that microtask inside an `act` block so React
 * doesn't warn about updates outside `act(...)`.
 */
const flushMicrotasks = () =>
	act( async () => {
		await Promise.resolve();
	} );

async function focusTextbox( textbox ) {
	fireEvent.focus( textbox );
	await flushMicrotasks();
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

	it( 'uses a consumer-supplied `id` for the textbox and label', () => {
		const { container } = render(
			<RichTextControl
				label="Custom id"
				value=""
				onChange={ () => {} }
				// eslint-disable-next-line no-restricted-syntax
				id="my-custom-id"
			/>
		);

		const textbox = getTextbox( container );
		expect( textbox ).toHaveAttribute( 'id', 'my-custom-id' );
		expect( screen.getByText( 'Custom id' ) ).toHaveAttribute(
			'for',
			'my-custom-id'
		);
	} );

	describe( 'line breaks', () => {
		it( 'blocks Enter from inserting line breaks when `disableLineBreaks` is set', async () => {
			const onChange = jest.fn();
			const { container } = render(
				<RichTextControl
					label="Single line"
					value=""
					onChange={ onChange }
					disableLineBreaks
				/>
			);
			const textbox = getTextbox( container );
			await focusTextbox( textbox );

			// `fireEvent` returns `false` when `preventDefault()` was called.
			expect( fireEvent.keyDown( textbox, { key: 'Enter' } ) ).toBe(
				false
			);
			expect( onChange ).not.toHaveBeenCalled();
		} );

		it.each( [
			[ 'Enter', {} ],
			[ 'Shift+Enter', { shiftKey: true } ],
		] )(
			'inserts a single line break into the value on %s',
			async ( _label, modifiers ) => {
				const onChange = jest.fn();
				const { container } = render(
					<RichTextControl
						label="Note"
						value="hi"
						onChange={ onChange }
					/>
				);
				const textbox = getTextbox( container );
				await focusTextbox( textbox );

				/*
				 * The control takes over Enter handling from the browser
				 * (native contenteditable handling appends an extra `<br>` at
				 * the end of the content, rendering as two new lines) and
				 * inserts the break into the rich text value instead.
				 */
				expect(
					fireEvent.keyDown( textbox, {
						key: 'Enter',
						...modifiers,
					} )
				).toBe( false );
				expect( onChange ).toHaveBeenCalledTimes( 1 );
				expect( onChange.mock.calls[ 0 ][ 0 ] ).toBe( 'hi<br>' );
			}
		);

		it( 'leaves Enter presses with a meta or ctrl modifier to consumers', async () => {
			const onChange = jest.fn();
			const { container } = render(
				<RichTextControl
					label="Note"
					value="hi"
					onChange={ onChange }
				/>
			);
			const textbox = getTextbox( container );
			await focusTextbox( textbox );

			expect(
				fireEvent.keyDown( textbox, { key: 'Enter', metaKey: true } )
			).toBe( true );
			expect(
				fireEvent.keyDown( textbox, { key: 'Enter', ctrlKey: true } )
			).toBe( true );
			expect( onChange ).not.toHaveBeenCalled();
		} );
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
		expect( textbox ).toHaveClass( 'wp-rich-text-control' );
		expect( textbox ).toHaveClass( 'my-custom-class' );
	} );

	it( 'does not take focus on mount by default', () => {
		const { container } = render(
			<RichTextControl label="Note" value="" onChange={ () => {} } />
		);

		expect( getTextbox( container ) ).not.toHaveFocus();
	} );

	it( 'takes focus on mount when `focusOnMount` is set', () => {
		const { container } = render(
			<RichTextControl
				label="Note"
				value=""
				onChange={ () => {} }
				focusOnMount
			/>
		);

		expect( getTextbox( container ) ).toHaveFocus();
	} );

	describe( 'keyboard shortcuts', () => {
		// Hold the latest `onUse` mock in a closure-captured ref so the
		// format type can be registered once in `beforeAll` (avoiding store
		// updates during render that would re-fire `useSelect` outside
		// `act(...)`), while each test can still assert on a fresh mock.
		let currentOnUse;

		// Re-implement `RichTextShortcut` locally to keep the assertion on
		// the registration contract explicit. It registers a callback into
		// the shared `keyboardShortcutContext` (now owned by
		// `@wordpress/rich-text`) that the control provides — the same
		// context the real `RichTextShortcut` reads. Mirrors the contract of
		// `packages/block-editor/src/components/rich-text/shortcut.js`.
		function TestShortcut( { onUse } ) {
			const { useContext, useEffect } = require( '@wordpress/element' );
			const {
				privateApis: richTextPrivateApis,
			} = require( '@wordpress/rich-text' );
			const { keyboardShortcutContext } = unlock( richTextPrivateApis );
			const keyboardShortcuts = useContext( keyboardShortcutContext );
			useEffect( () => {
				const shortcuts = keyboardShortcuts.current;
				const handler = ( event ) => {
					if (
						event.key === 'b' &&
						( event.ctrlKey || event.metaKey )
					) {
						event.preventDefault();
						onUse();
					}
				};
				shortcuts.add( handler );
				return () => {
					shortcuts.delete( handler );
				};
			}, [ onUse, keyboardShortcuts ] );
			return null;
		}

		beforeAll( () => {
			registerFormatType( 'core/test-shortcut', {
				title: 'Test Shortcut',
				tagName: 'mark',
				className: null,
				edit: () => <TestShortcut onUse={ () => currentOnUse() } />,
			} );
		} );

		afterAll( () => {
			unregisterFormatType( 'core/test-shortcut' );
		} );

		beforeEach( () => {
			currentOnUse = jest.fn();
		} );

		async function blurTextbox( textbox ) {
			fireEvent.blur( textbox );
			// `RichTextControl` defers deselection on blur via a 0ms
			// `setTimeout` so a portal-rendered popover (e.g., the
			// inline link UI) can claim focus before `FormatEdit`
			// unmounts. Flush that timer so the test sees the
			// deselected state.
			await act( async () => {
				await new Promise( ( resolve ) => setTimeout( resolve, 0 ) );
			} );
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

		// Focus the textbox, move focus into the supplied stand-in popover,
		// then blur the textbox and flush the deferred deselection timer.
		async function blurWithFocusInPopover( textbox, popoverButton ) {
			await focusTextbox( textbox );
			// Focus the popover-internal button before firing the textbox
			// blur so `document.activeElement` is the popover descendant by
			// the time the deferred check runs.
			popoverButton.focus();
			fireEvent.blur( textbox );
			await act( async () => {
				await new Promise( ( resolve ) => setTimeout( resolve, 0 ) );
			} );
		}

		it( 'keeps dispatching shortcuts when focus moves into a popover container', async () => {
			const { container } = render(
				<>
					<RichTextControl
						label="Shortcut popover"
						value=""
						onChange={ () => {} }
					/>
					{ /* Stand-in for the inline link UI popover, rendered into
					   an ambient `Popover.Slot` up the tree. */ }
					<div className="popover-slot">
						<button type="button">Inside popover</button>
					</div>
				</>
			);
			const textbox = getTextbox( container );

			await blurWithFocusInPopover(
				textbox,
				screen.getByRole( 'button', { name: 'Inside popover' } )
			);

			// `FormatEdit` should stay mounted, so the shortcut still
			// fires on a subsequent keydown delivered to the textbox.
			dispatchPrimaryB( textbox );
			expect( currentOnUse ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'keeps dispatching shortcuts when focus moves into a `@wordpress/ui` compat overlay', async () => {
			const { container } = render(
				<>
					<RichTextControl
						label="Shortcut overlay"
						value=""
						onChange={ () => {} }
					/>
					{ /* Stand-in for a popover migrated to `@wordpress/ui`,
					   which portals into the shared compat overlay slot. */ }
					<div data-wp-compat-overlay-slot>
						<button type="button">Inside overlay</button>
					</div>
				</>
			);
			const textbox = getTextbox( container );

			await blurWithFocusInPopover(
				textbox,
				screen.getByRole( 'button', { name: 'Inside overlay' } )
			);

			dispatchPrimaryB( textbox );
			expect( currentOnUse ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'deselects once focus leaves the control popover for elsewhere', async () => {
			const { container } = render(
				<>
					<RichTextControl
						label="Shortcut popover exit"
						value=""
						onChange={ () => {} }
					/>
					<div className="popover-slot">
						<button type="button">Inside popover</button>
					</div>
					<button type="button">Outside</button>
				</>
			);
			const textbox = getTextbox( container );
			const popoverButton = screen.getByRole( 'button', {
				name: 'Inside popover',
			} );

			await blurWithFocusInPopover( textbox, popoverButton );

			/*
			 * Focus now leaves the popover for an element that belongs to
			 * neither the field nor its popovers. The field's own `onBlur`
			 * already fired, so this exercises the document-level focus
			 * tracking that takes over during the popover excursion.
			 */
			screen.getByRole( 'button', { name: 'Outside' } ).focus();
			fireEvent.focusOut( popoverButton );
			await act( async () => {
				await new Promise( ( resolve ) => setTimeout( resolve, 0 ) );
			} );

			// The field deselected, so `FormatEdit` unmounted and the
			// shortcut no longer fires.
			dispatchPrimaryB( textbox );
			expect( currentOnUse ).not.toHaveBeenCalled();
		} );

		it( 'deselects when focus moves outside any popover container', async () => {
			const { container } = render(
				<>
					<RichTextControl
						label="Shortcut unrelated"
						value=""
						onChange={ () => {} }
					/>
					{ /* An element outside the field and outside every popover
					   container must not keep the field selected. */ }
					<div className="components-popover">
						<button type="button">Unrelated popover</button>
					</div>
				</>
			);
			const textbox = getTextbox( container );

			await blurWithFocusInPopover(
				textbox,
				screen.getByRole( 'button', { name: 'Unrelated popover' } )
			);

			// The field deselected, so `FormatEdit` unmounted and the
			// shortcut no longer fires.
			dispatchPrimaryB( textbox );
			expect( currentOnUse ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'format input rules', () => {
		// `__unstableInputRule` lets a format type transform the value when
		// the user types (e.g. wrapping a snippet in backticks auto-applies
		// inline code). The fake format below uppercases any literal "abc"
		// to make the transform observable from a unit test without standing
		// up the full `core/code` machinery.
		beforeAll( () => {
			registerFormatType( 'core/test-input-rule', {
				title: 'Test Input Rule',
				tagName: 'span',
				className: 'test-input-rule',
				edit: () => null,
				__unstableInputRule( value ) {
					if ( ! value.text.includes( 'abc' ) ) {
						return value;
					}
					return {
						...value,
						text: value.text.replace( 'abc', 'ABC' ),
					};
				},
			} );
		} );

		afterAll( () => {
			unregisterFormatType( 'core/test-input-rule' );
		} );

		it( 'runs registered format input rules on insertText input events', async () => {
			const onChange = jest.fn();
			const { container } = render(
				<RichTextControl
					label="Input rule"
					value="abc"
					onChange={ onChange }
				/>
			);
			const textbox = getTextbox( container );

			fireEvent.focus( textbox );
			await flushMicrotasks();

			fireEvent.input( textbox, { inputType: 'insertText' } );

			// `onChange` is called with the transformed HTML string. The
			// fake input rule above uppercases "abc" → "ABC".
			expect( onChange ).toHaveBeenCalled();
			const lastCall =
				onChange.mock.calls[ onChange.mock.calls.length - 1 ];
			expect( lastCall[ 0 ] ).toContain( 'ABC' );
		} );

		it( 'ignores non-text input events', async () => {
			const onChange = jest.fn();
			const { container } = render(
				<RichTextControl
					label="Input rule ignore"
					value="abc"
					onChange={ onChange }
				/>
			);
			const textbox = getTextbox( container );

			fireEvent.focus( textbox );
			await flushMicrotasks();

			fireEvent.input( textbox, { inputType: 'deleteContentBackward' } );

			// `useRichText`'s own input handler may still fire `onChange`
			// for the deletion, but the format input-rule branch must not
			// run on non-text events — so the uppercase "ABC" transform
			// from the fake rule should never appear.
			for ( const [ updatedValue ] of onChange.mock.calls ) {
				expect( updatedValue ).not.toContain( 'ABC' );
			}
		} );
	} );
} );
