import { render, screen } from '@testing-library/react';
import { createRef, useId } from '@wordpress/element';
import {
	KeyboardShortcutDescription,
	KeyboardShortcutDisplay,
	useKeyboardShortcutProps,
} from '../keyboard-shortcut';

const shortcut = {
	displayShortcut: '⌘S',
	ariaKeyShortcut: 'Meta+S',
	label: 'Command S',
};

function ShortcutTarget( {
	'aria-describedby': ariaDescribedBy,
	'aria-keyshortcuts': ariaKeyShortcuts,
	withShortcut = true,
}: {
	'aria-describedby'?: string;
	'aria-keyshortcuts'?: string;
	withShortcut?: boolean;
} ) {
	const activeShortcut = withShortcut ? shortcut : undefined;
	const { descriptionId, targetProps } = useKeyboardShortcutProps( {
		'aria-describedby': ariaDescribedBy,
		'aria-keyshortcuts': ariaKeyShortcuts,
		shortcut: activeShortcut,
	} );

	return (
		<button { ...targetProps }>
			Save
			{ activeShortcut && descriptionId && (
				<KeyboardShortcutDescription
					descriptionId={ descriptionId }
					shortcut={ activeShortcut }
				/>
			) }
		</button>
	);
}

function ShortcutTargetWithExternalDescription( {
	withShortcut = true,
}: {
	withShortcut?: boolean;
} ) {
	const descriptionId = useId();

	return (
		<>
			<span id={ descriptionId }>Available offline.</span>
			<ShortcutTarget
				aria-describedby={ descriptionId }
				aria-keyshortcuts="Meta+S"
				withShortcut={ withShortcut }
			/>
		</>
	);
}

describe( 'keyboard shortcut utilities', () => {
	it( 'forwards the description ref to its span', () => {
		const ref = createRef< HTMLSpanElement >();
		const descriptionId = 'shortcut-description';

		render(
			<KeyboardShortcutDescription
				ref={ ref }
				descriptionId={ descriptionId }
				shortcut={ shortcut }
			/>
		);

		expect( ref.current ).toBe(
			screen.getByText( 'Keyboard shortcut: Command S' )
		);
		expect( ref.current ).toBeInstanceOf( HTMLSpanElement );
	} );

	it( 'forwards the display ref to its span', () => {
		const ref = createRef< HTMLSpanElement >();

		render( <KeyboardShortcutDisplay ref={ ref } shortcut={ shortcut } /> );

		expect( ref.current ).toBe( screen.getByText( '⌘S' ) );
		expect( ref.current ).toBeInstanceOf( HTMLSpanElement );
	} );

	it( 'adds shortcut metadata and a human-readable accessible description to the target', () => {
		render( <ShortcutTarget /> );

		const button = screen.getByRole( 'button', {
			name: 'Save',
			description: 'Keyboard shortcut: Command S',
		} );
		expect( button ).toHaveAttribute( 'aria-keyshortcuts', 'Meta+S' );
	} );

	it( 'preserves a consumer-provided accessible description', () => {
		render( <ShortcutTargetWithExternalDescription /> );

		expect(
			screen.getByRole( 'button', {
				name: 'Save',
				description: 'Available offline. Keyboard shortcut: Command S',
			} )
		).toBeInTheDocument();
	} );

	it( 'preserves direct ARIA props when shortcut metadata is omitted', () => {
		render(
			<ShortcutTargetWithExternalDescription withShortcut={ false } />
		);

		const button = screen.getByRole( 'button', {
			name: 'Save',
			description: 'Available offline.',
		} );
		expect( button ).toHaveAttribute( 'aria-keyshortcuts', 'Meta+S' );
	} );

	it( 'renders visual shortcut text left-to-right and hides it from assistive technology', () => {
		render( <KeyboardShortcutDisplay shortcut={ shortcut } /> );

		const display = screen.getByText( '⌘S' );
		expect( display ).toHaveAttribute( 'aria-hidden', 'true' );
		expect( display ).toHaveAttribute( 'dir', 'ltr' );
	} );
} );
