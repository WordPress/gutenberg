/**
 * External dependencies
 */
import { render, screen, fireEvent } from '@testing-library/react';

/*
 * The note form pulls in @wordpress/components, @wordpress/ui, and
 * @wordpress/block-editor. Their import graphs reach styling libraries that
 * aren't relevant to the form's logic. Substitute minimal stand-ins so the
 * test stays focused on the form's behavior: keyboard handling, the empty-
 * state guard, and the format allowlist.
 */
jest.mock( '@wordpress/components', () => ( {
	__esModule: true,
	__experimentalTruncate: ( { children } ) => <>{ children }</>,
	Button: ( {
		children,
		disabled,
		accessibleWhenDisabled,
		variant,
		size,
		...rest
	} ) => {
		void accessibleWhenDisabled;
		void variant;
		void size;
		return (
			<button disabled={ disabled } { ...rest }>
				{ children }
			</button>
		);
	},
} ) );

jest.mock( '@wordpress/ui', () => {
	const { cloneElement } = jest.requireActual( '@wordpress/element' );
	return {
		__esModule: true,
		Stack: ( { render: el, children, ...rest } ) =>
			el ? (
				cloneElement( el, rest, children )
			) : (
				<div { ...rest }>{ children }</div>
			),
	};
} );

// The form renders `RichTextControl` from `@wordpress/rich-text-control`,
// whose import graph reaches the full rich-text/components machinery that
// isn't relevant to the form's logic. Substitute a minimal contenteditable
// stand-in so the test stays focused on the form's behavior.
const MockRichTextControl = ( {
	value,
	onChange,
	allowedFormats,
	id,
	label,
	hideLabelFromVision,
	placeholder,
	focusOnMount,
	...rest
} ) => {
	// Silence unused destructured props for the mock.
	void label;
	void hideLabelFromVision;
	void placeholder;
	void focusOnMount;
	return (
		<div
			{ ...rest }
			id={ id }
			data-allowed-formats={ ( allowedFormats || [] ).join( ',' ) }
			data-testid="note-rich-text"
			contentEditable
			suppressContentEditableWarning
			onInput={ ( event ) =>
				onChange( event.currentTarget.textContent || '' )
			}
		>
			{ value }
		</div>
	);
};

jest.mock( '@wordpress/rich-text-control', () => ( {
	__esModule: true,
	RichTextControl: MockRichTextControl,
} ) );

jest.mock( '@wordpress/dom', () => ( {
	__unstableStripHTML: ( html ) => String( html ).replace( /<[^>]*>/g, '' ),
} ) );

/**
 * Internal dependencies
 */
const { NoteForm } = require( '../note-form' );

function setup( props = {} ) {
	const onSubmit = jest.fn();
	const onCancel = jest.fn();
	const utils = render(
		<NoteForm
			onSubmit={ onSubmit }
			onCancel={ onCancel }
			labels={ { submit: 'Add note', input: 'Note' } }
			{ ...props }
		/>
	);
	return { onSubmit, onCancel, ...utils };
}

function setInputValue( html ) {
	const input = screen.getByTestId( 'note-rich-text' );
	input.textContent = html;
	fireEvent.input( input );
	return input;
}

describe( 'NoteForm', () => {
	it( 'limits formats to bold, italic, link, and code', () => {
		setup();
		expect( screen.getByTestId( 'note-rich-text' ) ).toHaveAttribute(
			'data-allowed-formats',
			'core/bold,core/italic,core/link,core/code'
		);
	} );

	it( 'disables submit when the visible content is empty', () => {
		setup();
		expect(
			screen.getByRole( 'button', { name: 'Add note' } )
		).toBeDisabled();
	} );

	it( 'disables submit when the content is only whitespace-laden HTML', () => {
		setup();
		setInputValue( '<p>   </p>' );
		expect(
			screen.getByRole( 'button', { name: 'Add note' } )
		).toBeDisabled();
	} );

	it( 'enables submit once visible text is entered', () => {
		setup();
		setInputValue( 'Hello' );
		expect(
			screen.getByRole( 'button', { name: 'Add note' } )
		).toBeEnabled();
	} );

	it( 'submits the form on ⌘+Enter when the content is non-empty', () => {
		const { onSubmit } = setup();
		const input = setInputValue( 'Hello' );
		// `isKeyboardEvent.primary` uses Ctrl on non-Apple platforms; jsdom's
		// navigator.platform is empty, so Ctrl is the primary modifier here.
		fireEvent.keyDown( input, { key: 'Enter', ctrlKey: true } );
		expect( onSubmit ).toHaveBeenCalledWith( 'Hello' );
	} );

	it( 'submits the entered content when the submit button is clicked', () => {
		/*
		 * The reply and reopen flows reuse NoteForm and submit via this
		 * button, so this covers that replies work independently of the
		 * browser focus behavior exercised by the e2e suite.
		 */
		const { onSubmit } = setup( { labels: { submit: 'Reply' } } );
		setInputValue( 'A reply' );
		fireEvent.click( screen.getByRole( 'button', { name: 'Reply' } ) );
		expect( onSubmit ).toHaveBeenCalledWith( 'A reply' );
	} );

	it( 'does not submit on ⌘+Enter when the content is empty', () => {
		const { onSubmit } = setup();
		const input = screen.getByTestId( 'note-rich-text' );
		// `isKeyboardEvent.primary` uses Ctrl on non-Apple platforms; jsdom's
		// navigator.platform is empty, so Ctrl is the primary modifier here.
		fireEvent.keyDown( input, { key: 'Enter', ctrlKey: true } );
		expect( onSubmit ).not.toHaveBeenCalled();
	} );

	it( 'invokes onCancel when Escape is pressed', () => {
		const { onCancel } = setup();
		const input = screen.getByTestId( 'note-rich-text' );
		fireEvent.keyDown( input, { key: 'Escape' } );
		expect( onCancel ).toHaveBeenCalled();
	} );

	it( 'invokes onCancel when the Cancel button is clicked', () => {
		const { onCancel } = setup();
		fireEvent.click( screen.getByRole( 'button', { name: 'Cancel' } ) );
		expect( onCancel ).toHaveBeenCalled();
	} );
} );
