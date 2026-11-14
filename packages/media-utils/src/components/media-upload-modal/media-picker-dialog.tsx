import type { ReactNode } from 'react';
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
} from '@wordpress/element';
import { Modal } from '@wordpress/components';
import {
	// eslint-disable-next-line @wordpress/use-recommended-components -- Migrate the media picker while keeping its legacy fallback.
	Dialog,
} from '@wordpress/ui';

interface Props {
	children: ReactNode;
	headerActions: ReactNode;
	open: boolean;
	title: string;
	className: string;
	isDismissible: boolean;
	onClose: () => void;
	useUiOverlay: boolean;
}

/** Keep the legacy host when the supplied Components cannot use UI overlays. */
export function MediaPickerDialog( {
	children,
	headerActions,
	open,
	title,
	className,
	isDismissible,
	onClose,
	useUiOverlay,
}: Props ) {
	const openerRef = useRef< HTMLElement | null >( null );
	const popupRef = useRef< HTMLDivElement | null >( null );
	const openRef = useRef( open );
	useLayoutEffect( () => {
		openRef.current = open;
	}, [ open ] );
	const setSource = useCallback(
		( node: HTMLSpanElement | null ) => {
			if ( node && open ) {
				const active = node.ownerDocument.activeElement;
				openerRef.current =
					active instanceof
					node.ownerDocument.defaultView!.HTMLElement
						? active
						: null;
			}
		},
		[ open ]
	);
	const restoreFocus = useCallback( () => {
		const target = openerRef.current;
		const active = target?.ownerDocument.activeElement;
		if (
			target?.isConnected &&
			( ! active?.isConnected ||
				active === target.ownerDocument.body ||
				( ! openRef.current && popupRef.current?.contains( active ) ) )
		) {
			target.focus();
		}
	}, [] );
	useEffect( () => {
		if ( ! open ) {
			return;
		}
		return () => restoreFocus();
	}, [ open, restoreFocus ] );
	const source = <span hidden ref={ setSource } />;
	if ( ! useUiOverlay ) {
		return (
			<>
				{ source }
				{ open && (
					<Modal
						ref={ popupRef }
						title={ title }
						className={ className }
						size="fill"
						headerActions={ headerActions }
						isDismissible={ isDismissible }
						onRequestClose={ onClose }
					>
						{ children }
					</Modal>
				) }
			</>
		);
	}
	return (
		<>
			{ source }
			<Dialog.Root
				open={ open }
				onOpenChangeComplete={ ( nextOpen ) => {
					if ( ! nextOpen && ! openRef.current ) {
						restoreFocus();
					}
				} }
				onOpenChange={ ( nextOpen, details ) => {
					if ( ! nextOpen ) {
						if ( ! isDismissible ) {
							details.cancel();
							return;
						}
						onClose();
					}
				} }
			>
				<Dialog.Popup
					ref={ popupRef }
					finalFocus={ false }
					size="full"
					className={ className }
				>
					<Dialog.Header>
						<Dialog.Title>{ title }</Dialog.Title>
						{ headerActions }
						{ isDismissible && <Dialog.CloseIconButton /> }
					</Dialog.Header>
					{ children }
				</Dialog.Popup>
			</Dialog.Root>
		</>
	);
}
