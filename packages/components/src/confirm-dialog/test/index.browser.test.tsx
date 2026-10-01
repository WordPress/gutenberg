/* eslint-disable testing-library/no-node-access -- The z-index contract is set on presentation-only overlay elements. */
import { expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import Modal from '../../modal';
import { ConfirmDialog } from '..';
// The z-index contract spans ConfirmDialog's CSS Module and Modal's global
// overlay styles, so load the same global stylesheet WordPress enqueues.
// eslint-disable-next-line @wordpress/no-non-module-stylesheet-imports
import '../../modal/style.scss';

const noop = () => {};

it( 'renders above a regular Modal overlay', async () => {
	await render(
		<>
			<Modal
				title="Regular modal"
				onRequestClose={ noop }
				shouldCloseOnClickOutside={ false }
			>
				Regular modal content
			</Modal>
			<ConfirmDialog
				title="Confirm dialog"
				onConfirm={ noop }
				onCancel={ noop }
			>
				Confirm dialog content
			</ConfirmDialog>
		</>
	);

	// The second modal makes the first one inert and inaccessible. Start from
	// its visible title to reach the presentation-only overlay.
	const modalOverlay = screen
		.getByText( 'Regular modal' )
		.closest( '[role="dialog"]' )!.parentElement!;
	// Semantic queries cannot reach the presentation-only overlay.
	const confirmOverlay = screen.getByRole( 'dialog', {
		name: 'Confirm dialog',
	} ).parentElement!;

	expect(
		Number( getComputedStyle( confirmOverlay ).zIndex )
	).toBeGreaterThan( Number( getComputedStyle( modalOverlay ).zIndex ) );
} );
/* eslint-enable testing-library/no-node-access */
