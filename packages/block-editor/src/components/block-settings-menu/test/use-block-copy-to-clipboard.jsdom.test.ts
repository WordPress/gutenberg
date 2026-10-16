import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import {
	createEvent,
	fireEvent,
	render,
	screen,
	waitFor,
} from '@testing-library/react';
import { createElement } from '@wordpress/element';
import useBlockCopyToClipboard, {
	writeBlocksToClipboard,
} from '../use-block-copy-to-clipboard';

const content = {
	html: '<!-- wp:paragraph --><p>Bound <strong>text</strong></p><!-- /wp:paragraph -->',
	plainText: 'Bound text',
	hasBoundAttributes: true,
};

function CopyButton( {
	getContent = () => content,
	getText = () => '<p>Stored text</p>',
	onSuccess,
}: {
	getContent?: Parameters< typeof useBlockCopyToClipboard >[ 0 ];
	getText?: Parameters< typeof useBlockCopyToClipboard >[ 1 ];
	onSuccess?: Parameters< typeof useBlockCopyToClipboard >[ 2 ];
} ) {
	const ref = useBlockCopyToClipboard( getContent, getText, onSuccess );
	return createElement( 'button', { ref }, 'Copy' );
}

function readBlob( blob: Blob ) {
	if ( blob.text ) {
		return blob.text();
	}
	return new Promise< string | ArrayBuffer | null >( ( resolve ) => {
		const reader = new window.FileReader();
		reader.onload = () => resolve( reader.result );
		reader.readAsText( blob );
	} );
}

describe( 'block clipboard writes', () => {
	let clipboardDescriptor: PropertyDescriptor | undefined;
	let execCommandDescriptor: PropertyDescriptor | undefined;
	let clipboard: {
		write: Mock<
			(
				items: { representations: Record< string, Blob > }[]
			) => Promise< void >
		>;
		writeText: Mock< ( text: string ) => Promise< void > >;
	};

	beforeEach( () => {
		clipboardDescriptor = Object.getOwnPropertyDescriptor(
			navigator,
			'clipboard'
		);
		execCommandDescriptor = Object.getOwnPropertyDescriptor(
			document,
			'execCommand'
		);
		clipboard = {
			write: vi.fn().mockResolvedValue( undefined ),
			writeText: vi.fn().mockResolvedValue( undefined ),
		};
		Object.defineProperty( navigator, 'clipboard', {
			configurable: true,
			value: clipboard,
		} );
		Object.defineProperty( document, 'execCommand', {
			configurable: true,
			value: vi.fn().mockReturnValue( false ),
		} );
		vi.stubGlobal(
			'ClipboardItem',
			class {
				representations: Record< string, Blob >;
				constructor( representations: Record< string, Blob > ) {
					this.representations = representations;
				}
			}
		);
	} );

	afterEach( () => {
		document.getSelection()!.removeAllRanges();
		if ( clipboardDescriptor ) {
			Object.defineProperty(
				navigator,
				'clipboard',
				clipboardDescriptor
			);
		} else {
			Reflect.deleteProperty( navigator, 'clipboard' );
		}
		if ( execCommandDescriptor ) {
			Object.defineProperty(
				document,
				'execCommand',
				execCommandDescriptor
			);
		} else {
			delete ( document as Partial< Document > ).execCommand;
		}
		vi.unstubAllGlobals();
	} );

	it( 'writes both clipboard representations and notifies on success', async () => {
		const onSuccess = vi.fn();
		render( createElement( CopyButton, { onSuccess } ) );
		fireEvent.click( screen.getByRole( 'button', { name: 'Copy' } ) );

		await waitFor( () => expect( onSuccess ).toHaveBeenCalledTimes( 1 ) );
		expect( clipboard.writeText ).not.toHaveBeenCalled();
		const item = clipboard.write.mock.calls[ 0 ][ 0 ][ 0 ];
		expect( Object.keys( item.representations ) ).toEqual( [
			'text/html',
			'text/plain',
		] );
		expect( await readBlob( item.representations[ 'text/html' ] ) ).toBe(
			content.html
		);
		expect( await readBlob( item.representations[ 'text/plain' ] ) ).toBe(
			content.plainText
		);
		expect( screen.getByRole( 'button', { name: 'Copy' } ) ).toHaveFocus();
	} );

	it( 'keeps unbound blocks on the serialized text path', async () => {
		const onSuccess = vi.fn();
		render(
			createElement( CopyButton, {
				getContent: () => ( { hasBoundAttributes: false as const } ),
				onSuccess,
			} )
		);
		fireEvent.click( screen.getByRole( 'button', { name: 'Copy' } ) );

		await waitFor( () => expect( onSuccess ).toHaveBeenCalledTimes( 1 ) );
		expect( clipboard.writeText ).toHaveBeenCalledWith(
			'<p>Stored text</p>'
		);
		expect( clipboard.write ).not.toHaveBeenCalled();
	} );

	it( 'reads resolved values when the button is clicked', async () => {
		let currentContent = content;
		const onSuccess = vi.fn();
		render(
			createElement( CopyButton, {
				getContent: () => currentContent,
				onSuccess,
			} )
		);
		currentContent = { ...content, plainText: 'Updated text' };
		fireEvent.click( screen.getByRole( 'button', { name: 'Copy' } ) );

		await waitFor( () => expect( onSuccess ).toHaveBeenCalledTimes( 1 ) );
		const item = clipboard.write.mock.calls[ 0 ][ 0 ][ 0 ];
		expect( await readBlob( item.representations[ 'text/plain' ] ) ).toBe(
			'Updated text'
		);
	} );

	it( 'uses the copy event on HTTP and restores the text selection', async () => {
		vi.stubGlobal( 'ClipboardItem', undefined );
		render(
			createElement(
				'div',
				{
					contentEditable: true,
					suppressContentEditableWarning: true,
					tabIndex: 0,
				},
				'Original selection'
			)
		);
		const editable = screen.getByText( 'Original selection' );
		editable.focus();
		const range = document.createRange();
		range.selectNodeContents( editable );
		document.getSelection()!.removeAllRanges();
		document.getSelection()!.addRange( range );
		expect( document.getSelection()!.toString() ).toBe(
			'Original selection'
		);
		const setData = vi.fn();
		let copyEvent!: Event;
		vi.mocked( document.execCommand ).mockImplementation( () => {
			copyEvent = createEvent.copy( screen.getByRole( 'textbox' ), {
				clipboardData: { setData },
			} );
			fireEvent( screen.getByRole( 'textbox' ), copyEvent );
			return true;
		} );

		expect( await writeBlocksToClipboard( content, editable ) ).toBe(
			true
		);
		expect( copyEvent.defaultPrevented ).toBe( true );
		expect( setData ).toHaveBeenCalledWith(
			'text/plain',
			content.plainText
		);
		expect( setData ).toHaveBeenCalledWith( 'text/html', content.html );
		expect( screen.queryByRole( 'textbox' ) ).not.toBeInTheDocument();
		expect( editable ).toHaveFocus();
		expect( document.getSelection()!.toString() ).toBe(
			'Original selection'
		);
		setData.mockClear();
		editable.dispatchEvent( copyEvent );
		expect( setData ).not.toHaveBeenCalled();
	} );

	it( 'copies HTML with empty plain text when the fallback requires a nonempty selection', async () => {
		vi.stubGlobal( 'ClipboardItem', undefined );
		const emptyTextContent = {
			...content,
			html: '<!-- wp:image --><figure><img src="https://example.com/image.jpg" alt="" /></figure><!-- /wp:image -->',
			plainText: '',
		};
		render( createElement( 'button', null, 'Trigger' ) );
		const setData = vi.fn();
		vi.mocked( document.execCommand ).mockImplementation( () => {
			const textarea =
				screen.getByRole< HTMLTextAreaElement >( 'textbox' );
			if (
				! textarea.value.length ||
				textarea.selectionStart === textarea.selectionEnd
			) {
				return false;
			}
			fireEvent.copy( textarea, { clipboardData: { setData } } );
			return true;
		} );

		expect(
			await writeBlocksToClipboard(
				emptyTextContent,
				screen.getByRole( 'button' )
			)
		).toBe( true );
		expect( setData ).toHaveBeenCalledWith(
			'text/html',
			emptyTextContent.html
		);
		expect( setData ).toHaveBeenCalledWith( 'text/plain', '' );
		expect( screen.queryByRole( 'textbox' ) ).not.toBeInTheDocument();
	} );

	it( 'restores an input selection when the fallback fails', async () => {
		vi.stubGlobal( 'ClipboardItem', undefined );
		render(
			createElement( 'input', {
				'aria-label': 'Original input',
				defaultValue: 'Original value',
			} )
		);
		const input = screen.getByRole< HTMLInputElement >( 'textbox', {
			name: 'Original input',
		} );
		input.focus();
		input.setSelectionRange( 2, 6, 'backward' );
		vi.mocked( document.execCommand ).mockImplementation( () => {
			throw new Error( 'Copy unavailable' );
		} );

		expect( await writeBlocksToClipboard( content, input ) ).toBe( false );
		expect( input ).toHaveFocus();
		expect( input.selectionStart ).toBe( 2 );
		expect( input.selectionEnd ).toBe( 6 );
		expect( input.selectionDirection ).toBe( 'backward' );
		expect( screen.getAllByRole( 'textbox' ) ).toEqual( [ input ] );
	} );

	it( 'does not report success when execCommand omits the copy event', async () => {
		vi.stubGlobal( 'ClipboardItem', undefined );
		vi.mocked( document.execCommand ).mockReturnValue( true );
		render( createElement( 'button', null, 'Trigger' ) );

		expect(
			await writeBlocksToClipboard(
				content,
				screen.getByRole( 'button' )
			)
		).toBe( false );
	} );

	it( 'does not run success callbacks if both clipboard methods fail', async () => {
		clipboard.write.mockRejectedValue( new Error( 'Clipboard denied' ) );
		const onSuccess = vi.fn();
		render( createElement( CopyButton, { onSuccess } ) );
		fireEvent.click( screen.getByRole( 'button', { name: 'Copy' } ) );

		await waitFor( () =>
			expect( document.execCommand ).toHaveBeenCalled()
		);
		expect( onSuccess ).not.toHaveBeenCalled();
		expect( screen.queryByRole( 'textbox' ) ).not.toBeInTheDocument();
	} );

	it( 'retains the serialized text fallback when there are no bindings', async () => {
		Object.defineProperty( navigator, 'clipboard', {
			configurable: true,
			value: undefined,
		} );
		vi.mocked( document.execCommand ).mockImplementation( () => {
			expect( screen.getByRole( 'textbox' ) ).toHaveValue(
				'<p>Stored text</p>'
			);
			return true;
		} );
		const onSuccess = vi.fn();
		render(
			createElement( CopyButton, {
				getContent: () => ( { hasBoundAttributes: false as const } ),
				onSuccess,
			} )
		);
		fireEvent.click( screen.getByRole( 'button', { name: 'Copy' } ) );

		await waitFor( () => expect( onSuccess ).toHaveBeenCalledTimes( 1 ) );
		expect( screen.queryByRole( 'textbox' ) ).not.toBeInTheDocument();
	} );

	it( 'runs the success callback after unmount without restoring focus to the removed button', async () => {
		let finishWrite!: () => void;
		clipboard.write.mockReturnValue(
			new Promise< void >( ( resolve ) => {
				finishWrite = resolve;
			} )
		);
		const onSuccess = vi.fn();
		const { unmount } = render(
			createElement( CopyButton, { onSuccess } )
		);
		const button = screen.getByRole( 'button', { name: 'Copy' } );
		const focus = vi.spyOn( button, 'focus' );
		fireEvent.click( button );
		unmount();
		finishWrite();

		await waitFor( () => expect( onSuccess ).toHaveBeenCalledTimes( 1 ) );
		expect( focus ).not.toHaveBeenCalled();
	} );
} );
