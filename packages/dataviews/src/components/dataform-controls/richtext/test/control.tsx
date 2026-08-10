import { render, screen, fireEvent, act } from '@testing-library/react';
import type { MutableRefObject } from 'react';
import { useContext, useEffect, useState } from '@wordpress/element';
import { Fill, Popover, Slot, SlotFillProvider } from '@wordpress/components';
import {
	unregisterFormatType,
	registerFormatType,
	privateApis as richTextPrivateApis,
} from '@wordpress/rich-text';
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

// Flush a deferred (0ms `setTimeout`) update — e.g. `useFocusOutside`'s blur
// check, or a validity message revealed after the field is touched.
const flushTimeouts = () =>
	act( async () => {
		await new Promise( ( resolve ) => setTimeout( resolve, 0 ) );
	} );

// Move real focus (and flush the selection microtask focusing the editable
// schedules). `useFocusOutside` needs real focus order: `focusout` on the old
// element before `focusin` on the new.
async function moveFocusTo( element: HTMLElement ) {
	act( () => {
		element.focus();
	} );
	await flushMicrotasks();
}

// Type the way a browser would — `useRichText` builds its value by reading the
// DOM and selection back from its own `input` handler.
async function typeIntoTextbox( textbox: HTMLElement, text: string ) {
	act( () => {
		textbox.textContent = text;
		const range = document.createRange();
		range.selectNodeContents( textbox );
		range.collapse( false );
		const selection = document.getSelection();
		selection?.removeAllRanges();
		selection?.addRange( range );
	} );
	fireEvent.input( textbox, { inputType: 'insertText' } );
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

		// The autocomplete popover measures the caret range to anchor itself,
		// which jsdom leaves unimplemented. Any non-empty rect lets it mount.
		Range.prototype.getClientRects = () =>
			[ new DOMRect( 0, 0, 1, 1 ) ] as unknown as DOMRectList;
	} );

	afterAll( () => {
		unregisterFormatType( 'core/bold' );
		// @ts-expect-error -- Restore jsdom's own (absent) implementation.
		delete Range.prototype.getClientRects;
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
		// A `<div contenteditable>` is not a labelable element, so the label
		// must not use `for`; the name is wired through `aria-labelledby`.
		expect( label ).not.toHaveAttribute( 'for' );
		expect( textbox ).toHaveAttribute( 'aria-labelledby', label.id );
		expect( textbox ).toHaveAccessibleName( 'Description' );
	} );

	it( 'renders without autocomplete when no `completers` are passed', () => {
		const { container } = render(
			<RichTextControl label="Note" value="" onChange={ () => {} } />
		);

		const textbox = getTextbox( container );
		// Zero-cost when not opted in: the autocomplete aria wiring only
		// appears once a completer matches typed input.
		expect( textbox ).not.toHaveAttribute( 'aria-autocomplete' );
	} );

	it( 'accepts a `completers` prop without breaking rendering', () => {
		const completer = {
			name: 'test/mentions',
			triggerPrefix: '@',
			useItems: () => [ [] ],
			getOptionCompletion: () => '@someone',
		};

		const { container } = render(
			<RichTextControl
				label="Note"
				value=""
				onChange={ () => {} }
				completers={
					[ completer ] as unknown as React.ComponentProps<
						typeof RichTextControl
					>[ 'completers' ]
				}
			/>
		);

		expect( getTextbox( container ) ).toBeInTheDocument();
	} );

	it( 'points the textbox at the suggestions listbox once a completer matches', async () => {
		// Held outside the completer: the options are reported back through an
		// effect keyed on their identity, so rebuilding them per render loops.
		const items = [ { key: 'alice', value: 'Alice', label: 'Alice' } ];
		const completer = {
			name: 'test/mentions',
			triggerPrefix: '@',
			useItems: () => [ items ],
			getOptionCompletion: () => '@Alice',
		};

		function ControlledRichText() {
			const [ value, setValue ] = useState( '' );
			return (
				<RichTextControl
					label="Note"
					value={ value }
					onChange={ setValue }
					completers={
						[ completer ] as unknown as React.ComponentProps<
							typeof RichTextControl
						>[ 'completers' ]
					}
				/>
			);
		}

		const { container } = render( <ControlledRichText /> );
		const textbox = getTextbox( container );

		await moveFocusTo( textbox );
		await typeIntoTextbox( textbox, '@' );

		const listbox = screen.getByRole( 'listbox' );
		const option = screen.getByRole( 'option', { name: 'Alice' } );

		expect( textbox ).toHaveAttribute( 'aria-autocomplete', 'list' );
		expect( textbox ).toHaveAttribute( 'aria-haspopup', 'listbox' );
		expect( textbox ).toHaveAttribute( 'aria-controls', listbox.id );
		expect( textbox ).toHaveAttribute( 'aria-activedescendant', option.id );
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
		expect( textbox ).toHaveAttribute(
			'aria-labelledby',
			'my-custom-id__label'
		);
		expect( screen.getByText( 'Custom id' ) ).toHaveAttribute(
			'id',
			'my-custom-id__label'
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
			await moveFocusTo( textbox );

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
				await moveFocusTo( textbox );

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
				await moveFocusTo( textbox );

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
			await moveFocusTo( textbox );

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
			// Stand-in for a format type that opens inline UI in a popover
			// (e.g. the link UI behind Cmd+K). A real `Popover`, so the tests
			// exercise the actual Slot/Fill decision rather than a portal stub.
			registerTestFormatType( 'core/test-popover-ui', {
				title: 'Test Popover UI',
				tagName: 'kbd',
				className: null,
				edit: () => (
					<Popover>
						<button type="button">Inside popover</button>
					</Popover>
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

			await moveFocusTo( textbox );

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
				<>
					<RichTextControl
						label="Shortcut blur"
						value=""
						onChange={ () => {} }
					/>
					<button type="button">Outside</button>
				</>
			);
			const textbox = getTextbox( container );

			await moveFocusTo( textbox );
			await moveFocusTo(
				screen.getByRole( 'button', { name: 'Outside' } )
			);
			await flushTimeouts();

			dispatchPrimaryB( textbox );
			expect( currentOnUse ).not.toHaveBeenCalled();
		} );

		it( "keeps dispatching shortcuts while focus is in the field's own popover", async () => {
			const { container } = render(
				<RichTextControl
					label="Shortcut popover"
					value=""
					onChange={ () => {} }
				/>
			);
			const textbox = getTextbox( container );

			// Selecting the field mounts the stub format's popover.
			await moveFocusTo( textbox );
			const popoverButton = screen.getByRole( 'button', {
				name: 'Inside popover',
			} );

			// No `Popover.Slot` in the field's registry, so the popover lands
			// in the body-level fallback container, outside the field's DOM.
			expect(
				// eslint-disable-next-line testing-library/no-node-access
				popoverButton.closest(
					'.components-popover__fallback-container'
				)
			).toBeInTheDocument();
			expect( container ).not.toContainElement( popoverButton );

			await moveFocusTo( popoverButton );
			await flushTimeouts();

			// Focus stayed in UI the field owns, so `FormatEdit` stays mounted
			// and the shortcut still fires.
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

			await moveFocusTo( textbox );
			await moveFocusTo(
				screen.getByRole( 'button', { name: 'Inside popover' } )
			);

			// Focus leaves the popover for an unrelated element, so the field
			// deselects.
			await moveFocusTo(
				screen.getByRole( 'button', { name: 'Outside' } )
			);
			await flushTimeouts();

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
					{ /* Stand-in for a popover owned by unrelated UI (outside
					   the field's React tree): it must not keep the field
					   selected. */ }
					<div className="popover-slot">
						<button type="button">Unrelated popover</button>
					</div>
				</>
			);
			const textbox = getTextbox( container );

			await moveFocusTo( textbox );
			await moveFocusTo(
				screen.getByRole( 'button', { name: 'Unrelated popover' } )
			);
			await flushTimeouts();

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

			await moveFocusTo( textbox );
			fireEvent.blur( textbox );
			await flushTimeouts();

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
		// UIs can open.
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
			// Re-implement `RichTextToolbarButton` locally
			// (`@wordpress/block-editor` isn't a dependency here): format types
			// contribute toolbar buttons as `RichText.ToolbarControls.*` fills.
			registerTestFormatType( 'core/test-toolbar-button', {
				title: 'Test Toolbar Button',
				tagName: 'b',
				className: null,
				edit: () => (
					<Fill name="RichText.ToolbarControls.test">
						<button type="button">Format toolbar button</button>
					</Fill>
				),
			} );
		} );

		afterAll( () => {
			unregisterFormatType( 'core/test-edit-ui' );
			unregisterFormatType( 'core/test-toolbar-button' );
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

			await moveFocusTo( textbox );

			expect( screen.getByTestId( 'format-edit-ui' ) ).toHaveTextContent(
				'true'
			);
		} );

		it( 'keeps format toolbar fills out of a surrounding block toolbar', async () => {
			const { container } = render(
				<SlotFillProvider>
					<RichTextControl
						label="Toolbar isolation"
						value=""
						onChange={ () => {} }
					/>
					{ /* Stands in for the editor's block toolbar, which renders
					   the matching slots through `FormatToolbar`. */ }
					<div data-testid="block-toolbar">
						<Slot name="RichText.ToolbarControls.test" />
					</div>
				</SlotFillProvider>
			);

			// Selecting the field mounts `FormatEdit` and its toolbar fill.
			await moveFocusTo( getTextbox( container ) );
			expect(
				screen.getByTestId( 'format-edit-ui' )
			).toBeInTheDocument();

			expect(
				screen.getByTestId( 'block-toolbar' )
			).toBeEmptyDOMElement();
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

			await moveFocusTo( textbox );

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

			await moveFocusTo( textbox );

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
