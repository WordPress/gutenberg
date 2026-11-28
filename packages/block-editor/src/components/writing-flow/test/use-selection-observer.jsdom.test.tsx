import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { dispatch, select } from '@wordpress/data';
import { store as blockEditorStore } from '../../../store';
import useSelectionObserver from '../use-selection-observer';

function Harness() {
	const ref = useSelectionObserver();
	return (
		<div ref={ ref } contentEditable suppressContentEditableWarning>
			<p
				id="block-1"
				className="block-editor-block-list__block"
				data-testid="p1"
				data-block="1"
				data-wp-block-attribute-key="content"
			>
				First paragraph
			</p>
			<p
				id="block-2"
				className="block-editor-block-list__block"
				data-testid="p2"
				data-block="2"
				data-wp-block-attribute-key="content"
			>
				<br data-rich-text-bogus="true" />
			</p>
			<p
				id="block-3"
				className="block-editor-block-list__block"
				data-testid="p3"
				data-block="3"
				data-wp-block-attribute-key="content"
			>
				Third paragraph
			</p>
		</div>
	);
}

describe( 'useSelectionObserver', () => {
	let selectionChangeSpy: ReturnType< typeof vi.spyOn >;
	let multiSelectSpy: ReturnType< typeof vi.spyOn >;

	beforeEach( () => {
		vi.restoreAllMocks();

		vi.spyOn(
			select( blockEditorStore ),
			'getBlockParents'
		).mockReturnValue( [] );
		vi.spyOn(
			select( blockEditorStore ),
			'getBlockSelectionStart'
		).mockReturnValue( 'block-1' );
		vi.spyOn(
			select( blockEditorStore ),
			'isDraggingBlocks'
		).mockReturnValue( false );
		vi.spyOn(
			select( blockEditorStore ),
			'isMultiSelecting'
		).mockReturnValue( false );
		vi.spyOn(
			select( blockEditorStore ),
			'getSelectionStart'
		).mockReturnValue( {
			clientId: 'block-1',
			attributeKey: 'content',
			offset: 0,
		} );
		vi.spyOn(
			select( blockEditorStore ),
			'getSelectionEnd'
		).mockReturnValue( {
			clientId: 'block-1',
			attributeKey: 'content',
			offset: 0,
		} );
		vi.spyOn(
			select( blockEditorStore ),
			'getSelectedBlockClientId'
		).mockReturnValue( 'block-1' );

		selectionChangeSpy = vi
			.spyOn( dispatch( blockEditorStore ), 'selectionChange' )
			.mockImplementation( () => {} );
		multiSelectSpy = vi
			.spyOn( dispatch( blockEditorStore ), 'multiSelect' )
			.mockImplementation( () => {} );
		vi.spyOn(
			dispatch( blockEditorStore ),
			'selectBlock'
		).mockImplementation( () => {} );
	} );

	function setOvershotSelectionOnEmptyParagraph() {
		const p2 = screen.getByTestId( 'p2' );
		const p3 = screen.getByTestId( 'p3' );
		const { ownerDocument } = p2;
		const range = ownerDocument.createRange();
		range.setStart( p2, 0 );
		range.setEnd( p3, 0 );
		const selection = ownerDocument.defaultView!.getSelection()!;
		selection.removeAllRanges();
		selection.addRange( range );
		return p2;
	}

	it( 'keeps selection on the empty paragraph when right-click overshoots into the next block at offset 0', () => {
		render( <Harness /> );
		const p2 = screen.getByTestId( 'p2' );

		p2.dispatchEvent(
			new MouseEvent( 'mousedown', {
				bubbles: true,
				button: 2,
				detail: 1,
			} )
		);
		setOvershotSelectionOnEmptyParagraph();
		p2.ownerDocument.dispatchEvent( new Event( 'selectionchange' ) );

		expect( multiSelectSpy ).not.toHaveBeenCalled();
		expect( selectionChangeSpy ).toHaveBeenCalledWith( {
			start: {
				clientId: '2',
				attributeKey: 'content',
				offset: 0,
			},
			end: {
				clientId: '2',
				attributeKey: 'content',
				offset: 0,
			},
		} );
	} );

	it( 'keeps selection on the empty paragraph when contextmenu (e.g. Ctrl+Click) overshoots into the next block at offset 0', () => {
		render( <Harness /> );
		const p2 = screen.getByTestId( 'p2' );

		p2.dispatchEvent(
			new MouseEvent( 'mousedown', {
				bubbles: true,
				button: 0,
				ctrlKey: true,
				detail: 1,
			} )
		);
		p2.dispatchEvent(
			new MouseEvent( 'contextmenu', {
				bubbles: true,
				button: 0,
				ctrlKey: true,
			} )
		);
		setOvershotSelectionOnEmptyParagraph();
		p2.ownerDocument.dispatchEvent( new Event( 'selectionchange' ) );

		expect( multiSelectSpy ).not.toHaveBeenCalled();
		expect( selectionChangeSpy ).toHaveBeenCalledWith( {
			start: {
				clientId: '2',
				attributeKey: 'content',
				offset: 0,
			},
			end: {
				clientId: '2',
				attributeKey: 'content',
				offset: 0,
			},
		} );
	} );

	it( 'does not suppress cross-block keyboard selection ending at offset 0 of the next block', () => {
		render( <Harness /> );
		const p2 = screen.getByTestId( 'p2' );

		p2.dispatchEvent(
			new KeyboardEvent( 'keydown', {
				bubbles: true,
				key: 'ArrowDown',
				shiftKey: true,
			} )
		);
		setOvershotSelectionOnEmptyParagraph();
		p2.ownerDocument.dispatchEvent( new Event( 'selectionchange' ) );

		expect( selectionChangeSpy ).toHaveBeenCalledWith(
			expect.objectContaining( {
				start: expect.objectContaining( { clientId: '2' } ),
				end: expect.objectContaining( { clientId: '3' } ),
			} )
		);
	} );
} );
