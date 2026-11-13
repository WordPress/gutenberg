import { useLayoutEffect, useState } from '@wordpress/element';
import {
	// eslint-disable-next-line @wordpress/use-recommended-components -- Replace the legacy media overlay shell.
	Dialog,
	VisuallyHidden,
	useEnableWpCompatOverlaySlot,
} from '@wordpress/ui';
import styles from './media-frame-dialog.module.css';

interface MediaFrameDialogProps {
	onOpen: ( container: HTMLDivElement ) => HTMLElement | null;
	onClose: () => void;
	onKeyDown: ( event: KeyboardEvent ) => void;
	open: boolean;
	title: string;
}

/**
 * Keeps the Core media frame and its events while Dialog owns the overlay.
 */
export function MediaFrameDialog( {
	onOpen,
	onClose,
	onKeyDown,
	open,
	title,
}: MediaFrameDialogProps ) {
	useEnableWpCompatOverlaySlot();
	const [ frameTitle, setFrameTitle ] = useState( title );
	const [ container, setContainer ] = useState< HTMLDivElement | null >(
		null
	);

	useLayoutEffect( () => {
		if ( ! open || ! container ) {
			return;
		}

		const heading = onOpen( container );
		if ( ! heading ) {
			return;
		}
		// Core updates the visible heading when the user changes media workflows.
		const syncTitle = () => setFrameTitle( heading.textContent || title );
		syncTitle();
		const observer = new MutationObserver( syncTitle );
		observer.observe( heading, {
			childList: true,
			characterData: true,
			subtree: true,
		} );
		return () => observer.disconnect();
	}, [ onOpen, open, container, title ] );

	return (
		<Dialog.Root
			open={ open }
			onOpenChange={ ( isOpen ) => {
				if ( ! isOpen ) {
					onClose();
				}
			} }
		>
			<Dialog.Popup
				size="full"
				// Keep Core's uploader and reusable frame attached between openings.
				portal={ <Dialog.Portal keepMounted /> }
				className={ `media-modal ${ styles.popup }` }
				onKeyDownCapture={ ( event ) => onKeyDown( event.nativeEvent ) }
			>
				<VisuallyHidden render={ <Dialog.Title /> }>
					{ frameTitle }
				</VisuallyHidden>
				<Dialog.Content
					ref={ setContainer }
					className={ styles.content }
				/>
				<Dialog.CloseIconButton className="media-modal-close" />
			</Dialog.Popup>
		</Dialog.Root>
	);
}
