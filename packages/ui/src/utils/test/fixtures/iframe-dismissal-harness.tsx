import {
	createPortal,
	useId,
	useImperativeHandle,
	useRef,
	useState,
} from '@wordpress/element';
import { useIframeDismissalBridge } from '../../use-iframe-dismissal-bridge';

export function IframeDismissalHarness( {
	iframeKey,
	popupContainer,
	popupIframe = false,
}: {
	iframeKey?: string;
	popupContainer?: HTMLElement;
	popupIframe?: boolean;
} ) {
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

	const popup = open ? (
		<div
			id={ popupId }
			role="dialog"
			aria-label="Popup"
			data-rootownerid={ popupId }
		>
			<button>Inside popup</button>
			{ popupIframe && <iframe title="Popup frame" /> }
		</div>
	) : null;

	return (
		<>
			<button
				ref={ triggerRef }
				aria-controls={ open ? popupId : undefined }
				onClick={ () => changeOpen( ! open ) }
			>
				Actions
			</button>
			{ popupContainer ? createPortal( popup, popupContainer ) : popup }
			<iframe
				key={ iframeKey }
				title="Editor canvas"
				style={ { display: 'block', marginTop: 200 } }
			/>
		</>
	);
}
