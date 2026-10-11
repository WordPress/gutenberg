import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import {
	useId,
	useImperativeHandle,
	useRef,
	useState,
} from '@wordpress/element';
import { useIframeDismissalBridge } from '../use-iframe-dismissal-bridge';

function IframeDismissalHarness() {
	const [ open, setOpen ] = useState( false );
	const triggerRef = useRef< HTMLButtonElement >( null );
	const popupId = useId();
	const bridge = useIframeDismissalBridge( {
		modal: false,
		onOpenChange: setOpen,
	} );
	const changeOpen = ( nextOpen: boolean ) => {
		bridge.onOpenChange( nextOpen, {
			isCanceled: false,
			trigger: triggerRef.current ?? undefined,
		} );
	};
	useImperativeHandle( bridge.actionsRef, () => ( {
		close: () => changeOpen( false ),
	} ) );

	return (
		<>
			<button
				ref={ triggerRef }
				aria-controls={ open ? popupId : undefined }
				onClick={ () => changeOpen( ! open ) }
			>
				Actions
			</button>
			{ open && (
				<div
					id={ popupId }
					role="dialog"
					aria-label="Popup"
					data-rootownerid={ popupId }
				>
					<iframe title="Popup frame" />
				</div>
			) }
		</>
	);
}

describe( 'useIframeDismissalBridge', () => {
	it( 'stays open for a press inside an iframe in its popup', async () => {
		const onPopupClick = vi.fn();
		await render( <IframeDismissalHarness /> );

		await userEvent.click(
			screen.getByRole( 'button', { name: 'Actions' } )
		);
		await expect.element( page.getByRole( 'dialog' ) ).toBeVisible();

		const iframe = screen.getByTitle< HTMLIFrameElement >( 'Popup frame' );
		const iframeDocument = iframe.contentDocument;
		if ( ! iframeDocument ) {
			throw new Error( 'Expected a same-origin iframe document.' );
		}
		const button = iframeDocument.createElement( 'button' );
		button.textContent = 'Inside popup';
		button.addEventListener( 'click', onPopupClick );
		iframeDocument.body.appendChild( button );

		await page
			.frameLocator( page.getByTitle( 'Popup frame' ) )
			.getByRole( 'button', { name: 'Inside popup' } )
			.click();

		expect( onPopupClick ).toHaveBeenCalledTimes( 1 );
		await expect.element( page.getByRole( 'dialog' ) ).toBeVisible();
	} );
} );
