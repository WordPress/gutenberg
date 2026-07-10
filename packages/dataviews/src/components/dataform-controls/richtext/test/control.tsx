/**
 * External dependencies
 */
import { render, screen, fireEvent, act } from '@testing-library/react';
import type { MutableRefObject } from 'react';

/**
 * WordPress dependencies
 */
import { Fill } from '@wordpress/components';
import { useContext, useEffect } from '@wordpress/element';
import {
	unregisterFormatType,
	registerFormatType,
	privateApis as richTextPrivateApis,
} from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import RichTextControl from '../control';
import { unlock } from '../../../../lock-unlock';

/*
 * `registerFormatType` types its settings as the full `WPFormat` shape; the
 * minimal stubs in this file only need the members the control exercises.
 */
function registerTestFormatType(
	name: string,
	settings: Record< string, unknown >
) {
	registerFormatType(
		name,
		settings as unknown as Parameters< typeof registerFormatType >[ 1 ]
	);
}

function getTextbox( container: HTMLElement ) {
	return container.querySelector< HTMLElement >( '[role="textbox"]' )!;
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

async function focusTextbox( textbox: HTMLElement ) {
	fireEvent.focus( textbox );
	await flushMicrotasks();
}

describe( 'RichTextControl', () => {
	beforeAll( () => {
		// Register a minimal stub for `core/bold` so the optional
		// `allowedFormats` codepath has something to resolve when exercised.
		registerTestFormatType( 'core/bold', {
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

		it.each( [
			[ 'mid-composition', { isComposing: true } ],
			// Mac Safari fires the final Enter of a composition with
			// `isComposing: false` but `keyCode: 229`.
			[ 'ending a composition in Mac Safari', { keyCode: 229 } ],
		] )(
			'leaves Enter presses from an IME %s to the browser',
			async ( _label, eventInit ) => {
				const onChange = jest.fn();
				const { container } = render(
					<RichTextControl
						label="Note"
						value="こんにちは"
						onChange={ onChange }
					/>
				);
				const textbox = getTextbox( container );
				await focusTextbox( textbox );

				/*
				 * During IME composition (e.g. CJK input), Enter confirms
				 * the composed text rather than requesting a line break;
				 * intercepting it would swallow the confirmation. The
				 * handler must not `preventDefault()` (`fireEvent` returns
				 * `true`) nor insert a break.
				 */
				expect(
					fireEvent.keyDown( textbox, {
						key: 'Enter',
						...eventInit,
					} )
				).toBe( true );
				expect( onChange ).not.toHaveBeenCalled();
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

	it( 'applies a consumer-supplied className to the control wrapper', () => {
		const { container } = render(
			<RichTextControl
				label="Styled"
				value=""
				onChange={ () => {} }
				className="my-custom-class"
			/>
		);

		// The shell follows the components-package convention of putting the
		// consumer's `className` on the outermost wrapper, not the editable.
		expect(
			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			container.querySelector( '.components-base-control' )
		).toHaveClass( 'my-custom-class' );
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
		let currentOnUse: jest.Mock;

		// Re-implement `RichTextShortcut` locally to keep the assertion on
		// the registration contract explicit. It registers a callback into
		// the shared `KeyboardShortcutContext` (owned by
		// `@wordpress/rich-text`) that the control provides — the same
		// context the real `RichTextShortcut` reads. Mirrors the contract of
		// `packages/rich-text/src/keyboard-shortcut.js`.
		function TestShortcut( { onUse }: { onUse: () => void } ) {
			const { KeyboardShortcutContext } = unlock( richTextPrivateApis );
			// The context is created without a type argument on the private
			// API side, so type the ref it carries here.
			const keyboardShortcuts = useContext(
				KeyboardShortcutContext
			) as MutableRefObject< Set< ( event: KeyboardEvent ) => void > >;
			useEffect( () => {
				const shortcuts = keyboardShortcuts.current;
				const handler = ( event: KeyboardEvent ) => {
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
			registerTestFormatType( 'core/test-shortcut', {
				title: 'Test Shortcut',
				tagName: 'mark',
				className: null,
				edit: () => <TestShortcut onUse={ () => currentOnUse() } />,
			} );
			// Stand-in for a format type that opens a popover (e.g. the
			// inline link UI). `Popover` renders its content through a
			// `Fill` for the ambient popover slot — here that is the slot
			// the assembly owns, which is exactly what its blur handling
			// checks to prove the popover belongs to this field.
			registerTestFormatType( 'core/test-popover-ui', {
				title: 'Test Popover UI',
				tagName: 'kbd',
				className: null,
				edit: () => (
					<Fill name="Popover">
						<button type="button">Inside popover</button>
					</Fill>
				),
			} );
		} );

		afterAll( () => {
			unregisterFormatType( 'core/test-shortcut' );
			unregisterFormatType( 'core/test-popover-ui' );
		} );

		beforeEach( () => {
			currentOnUse = jest.fn();
		} );

		async function blurTextbox( textbox: HTMLElement ) {
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
		function dispatchPrimaryB( textbox: HTMLElement ) {
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

		// Focus the textbox, move focus into the supplied element, then blur
		// the textbox and flush the deferred deselection timer.
		async function blurWithFocusIn(
			textbox: HTMLElement,
			target: HTMLElement
		) {
			await focusTextbox( textbox );
			// Focus the target before firing the textbox blur so
			// `document.activeElement` points at it by the time the deferred
			// check runs.
			target.focus();
			fireEvent.blur( textbox );
			await act( async () => {
				await new Promise( ( resolve ) => setTimeout( resolve, 0 ) );
			} );
		}

		it( "keeps dispatching shortcuts while focus is in the field's own popover", async () => {
			const { container } = render(
				<RichTextControl
					label="Shortcut popover"
					value=""
					onChange={ () => {} }
				/>
			);
			const textbox = getTextbox( container );

			// Selecting the field mounts the stub format's popover content,
			// which portals into the `Popover.Slot` the field owns.
			await focusTextbox( textbox );
			const popoverButton = screen.getByRole( 'button', {
				name: 'Inside popover',
			} );

			await blurWithFocusIn( textbox, popoverButton );

			// `FormatEdit` should stay mounted, so the shortcut still
			// fires on a subsequent keydown delivered to the textbox.
			dispatchPrimaryB( textbox );
			expect( currentOnUse ).toHaveBeenCalledTimes( 1 );
		} );

		it( "deselects once focus leaves the field's popover for elsewhere", async () => {
			const { container } = render(
				<>
					<RichTextControl
						label="Shortcut popover exit"
						value=""
						onChange={ () => {} }
					/>
					<button type="button">Outside</button>
				</>
			);
			const textbox = getTextbox( container );

			await focusTextbox( textbox );
			const popoverButton = screen.getByRole( 'button', {
				name: 'Inside popover',
			} );

			await blurWithFocusIn( textbox, popoverButton );

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

		it( 'deselects when focus moves into a popover the field did not open', async () => {
			const { container } = render(
				<>
					<RichTextControl
						label="Shortcut unrelated"
						value=""
						onChange={ () => {} }
					/>
					{ /* Stand-in for a popover owned by unrelated UI (an
					   ambient popover slot outside the field): it must not
					   keep the field selected. */ }
					<div className="popover-slot">
						<button type="button">Unrelated popover</button>
					</div>
				</>
			);
			const textbox = getTextbox( container );

			await blurWithFocusIn(
				textbox,
				screen.getByRole( 'button', { name: 'Unrelated popover' } )
			);

			// The field deselected, so `FormatEdit` unmounted and the
			// shortcut no longer fires.
			dispatchPrimaryB( textbox );
			expect( currentOnUse ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'disabled and validation states', () => {
		it( 'renders a non-editable field with a disabled state when `disabled`', () => {
			const onChange = jest.fn();
			const { container } = render(
				<RichTextControl
					label="Summary"
					value="hi"
					onChange={ onChange }
					disabled
				/>
			);
			const textbox = getTextbox( container );

			expect( textbox ).toHaveAttribute( 'contenteditable', 'false' );
			expect( textbox ).toHaveAttribute( 'aria-disabled', 'true' );

			// A non-`contentEditable` div is not focusable, so real keyboard
			// input cannot reach the field; the listeners must not react to
			// programmatic events either.
			fireEvent.keyDown( textbox, { key: 'Enter' } );
			expect( onChange ).not.toHaveBeenCalled();
		} );

		it( 'appends the required indicator to the label and exposes `aria-required`', () => {
			const { container } = render(
				<RichTextControl
					label="Summary"
					value=""
					onChange={ () => {} }
					required
				/>
			);

			// The same "(Required)" label treatment the sibling validated
			// text controls get.
			expect( screen.getByText( 'Summary (Required)' ) ).toBeVisible();
			expect( getTextbox( container ) ).toHaveAttribute(
				'aria-required',
				'true'
			);
		} );

		it( 'marks the label optional with `markWhenOptional`', () => {
			render(
				<RichTextControl
					label="Summary"
					value=""
					onChange={ () => {} }
					markWhenOptional
				/>
			);

			expect( screen.getByText( 'Summary (Optional)' ) ).toBeVisible();
		} );

		it( 'surfaces an invalid state once the field has been touched', async () => {
			const { container } = render(
				<RichTextControl
					label="Summary"
					value=""
					onChange={ () => {} }
					customValidity={ {
						type: 'invalid',
						message: 'Enter a summary',
					} }
				/>
			);
			const textbox = getTextbox( container );

			expect( textbox ).toHaveAttribute( 'aria-invalid', 'true' );
			// The validity message only shows once the field has been
			// touched (blurred at least once), matching the sibling
			// validated controls.
			expect(
				screen.queryByText( 'Enter a summary' )
			).not.toBeInTheDocument();

			await focusTextbox( textbox );
			fireEvent.blur( textbox );
			await act( async () => {
				await new Promise( ( resolve ) => setTimeout( resolve, 0 ) );
			} );

			expect( screen.getByText( 'Enter a summary' ) ).toBeVisible();
		} );

		it( 'connects `help` to the field as its description', () => {
			const { container } = render(
				<RichTextControl
					label="Summary"
					value=""
					onChange={ () => {} }
					help="Add a short summary"
				/>
			);
			const textbox = getTextbox( container );
			const help = screen.getByText( 'Add a short summary' );

			expect( textbox ).toHaveAttribute( 'aria-describedby', help.id );
		} );
	} );

	describe( 'format edit UIs', () => {
		// Format types receive `isVisible` and gate both their toolbar
		// buttons and their inline UIs (e.g. the link popover opened via
		// Cmd+K) on it. The assembly must pass `isVisible` so the inline
		// UIs can open; the toolbar-button fills render into nothing since
		// a standalone field mounts no `RichText.ToolbarControls` slot.
		beforeAll( () => {
			registerTestFormatType( 'core/test-edit-ui', {
				title: 'Test Edit UI',
				tagName: 'samp',
				className: null,
				edit: ( { isVisible }: { isVisible: boolean } ) => (
					<div data-testid="format-edit-ui">
						{ String( isVisible ) }
					</div>
				),
			} );
		} );

		afterAll( () => {
			unregisterFormatType( 'core/test-edit-ui' );
		} );

		it( 'mounts format edit components with `isVisible` while the field is selected', async () => {
			const { container } = render(
				<RichTextControl
					label="Format UI"
					value=""
					onChange={ () => {} }
				/>
			);
			const textbox = getTextbox( container );

			// Not selected yet: `FormatEdit` is unmounted.
			expect(
				screen.queryByTestId( 'format-edit-ui' )
			).not.toBeInTheDocument();

			await focusTextbox( textbox );

			expect( screen.getByTestId( 'format-edit-ui' ) ).toHaveTextContent(
				'true'
			);
		} );
	} );

	describe( 'format input rules', () => {
		// `__unstableInputRule` lets a format type transform the value when
		// the user types (e.g. wrapping a snippet in backticks auto-applies
		// inline code). The fake format below uppercases any literal "abc"
		// to make the transform observable from a unit test without standing
		// up the full `core/code` machinery.
		beforeAll( () => {
			registerTestFormatType( 'core/test-input-rule', {
				title: 'Test Input Rule',
				tagName: 'span',
				className: 'test-input-rule',
				edit: () => null,
				__unstableInputRule( value: { text: string } ) {
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
