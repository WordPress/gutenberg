import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import type {
	MediaEditorProps,
	MediaEditorSaveResult,
} from '../../media-editor';
import { store as mediaEditorStore } from '../../../store';
import { MediaEditorModal } from '../index';

let mockSaveResult: MediaEditorSaveResult;
const mockOnUpdate = vi.fn();
let mockOnUndo: ( () => void ) | undefined;
const mockOnClose = vi.fn();
let registry: ReturnType< typeof createRegistry >;

vi.mock( import( '../../media-editor' ), () => {
	function MediaEditor( {
		onSaved,
		renderFrame,
		onClose,
	}: MediaEditorProps ) {
		return renderFrame( {
			children: (
				<button onClick={ () => onSaved?.( mockSaveResult ) }>
					Save result
				</button>
			),
			onRequestClose: () => onClose?.(),
			onKeyDown: () => {},
			shouldCloseOnClickOutside: false,
			isImage: true,
			layout: 'wide',
			isSaving: false,
			hasChanges: true,
			hasMedia: true,
		} );
	}
	return {
		default: Object.assign( MediaEditor, {
			HeaderActions: () => <></>,
			PanelToggle: () => <></>,
			MoreMenu: () => <></>,
			HistoryActions: () => <></>,
			SaveActions: () => <></>,
		} ),
	};
} );

async function renderModal() {
	registry.dispatch( mediaEditorStore ).openMediaEditorModal( {
		id: 10,
		onUpdate: mockOnUpdate,
		onUndo: mockOnUndo,
		onClose: mockOnClose,
	} );
	await render(
		<RegistryProvider value={ registry }>
			<MediaEditorModal />
		</RegistryProvider>
	);
	await expect
		.element( page.getByRole( 'dialog', { name: 'Edit media' } ) )
		.toBeVisible();
}

function getNotice() {
	const notices = registry.select( noticesStore ).getNotices();
	expect( notices ).toHaveLength( 1 );
	return notices[ 0 ];
}

describe( 'MediaEditorModal', () => {
	beforeEach( () => {
		mockOnUndo = undefined;
		mockSaveResult = {
			id: 11,
			url: 'edited.jpg',
			media: { id: 11, source_url: 'edited.jpg' },
			previous: { id: 10, url: 'original.jpg' },
		};
		registry = createRegistry();
		registry.register( mediaEditorStore );
		registry.register( noticesStore );
	} );

	it( 'restores the previous attachment when no Undo callback is supplied', async () => {
		await renderModal();
		await userEvent.click(
			page.getByRole( 'button', { name: 'Save result' } )
		);

		expect( mockOnUpdate ).toHaveBeenCalledWith( {
			id: 11,
			url: 'edited.jpg',
		} );
		expect( registry.select( mediaEditorStore ).isOpen() ).toBe( false );
		expect( mockOnClose ).toHaveBeenCalled();
		await expect
			.element( page.getByRole( 'dialog' ) )
			.not.toBeInTheDocument();

		const notice = getNotice();
		expect( notice ).toMatchObject( {
			content: 'Image edited.',
			type: 'snackbar',
			actions: [ { label: 'Undo', onClick: expect.any( Function ) } ],
		} );
		expect( notice ).not.toHaveProperty( 'context' );
		notice.actions[ 0 ].onClick!();
		expect( mockOnUpdate ).toHaveBeenLastCalledWith( {
			id: 10,
			url: 'original.jpg',
		} );
	} );

	it( "uses the caller's Undo callback after saving an attachment change", async () => {
		mockOnUndo = vi.fn();
		await renderModal();
		await userEvent.click(
			page.getByRole( 'button', { name: 'Save result' } )
		);
		getNotice().actions[ 0 ].onClick!();

		expect( mockOnUndo ).toHaveBeenCalledTimes( 1 );
		expect( mockOnUpdate ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'does not show the image edited snackbar for metadata-only saves', async () => {
		mockSaveResult = { ...mockSaveResult, previous: undefined };
		await renderModal();
		await userEvent.click(
			page.getByRole( 'button', { name: 'Save result' } )
		);

		expect( registry.select( noticesStore ).getNotices() ).toEqual( [] );
	} );
} );
