/**
 * WordPress dependencies
 */
import { createPortal, useEffect, useRef } from '@wordpress/element';
import { useInstanceId } from '@wordpress/compose';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import ModalFrame from './frame';
import ModalHeader from './header';
import * as ariaHelper from './aria-helper';

// Used to count the number of open modals.
let openModalCount = 0;

export default function Modal( {
	bodyOpenClassName = 'modal-open',
	title = null,
	isDismissible = true,
	isDismissable, // Deprecated
	/* accessibility */
	aria = {
		labelledby: null,
		describedby: null,
	},
	onRequestClose,
	icon,
	closeButtonLabel,
	children,
	...otherProps
} ) {
	const instanceId = useInstanceId( Modal );
	const ref = useRef();

	useEffect( () => {
		openModalCount++;

		if ( openModalCount === 1 ) {
			ariaHelper.hideApp( ref.current );
			document.body.classList.add( bodyOpenClassName );
		}

		return () => {
			openModalCount--;

			if ( openModalCount === 0 ) {
				document.body.classList.remove( bodyOpenClassName );
				ariaHelper.showApp();
			}
		};
	}, [] );

	const headingId = title
		? `components-modal-header-${ instanceId }`
		: aria.labelledby;

	if ( isDismissable ) {
		deprecated( 'isDismissable prop of the Modal component', {
			since: '5.4',
			alternative: 'isDismissible prop (renamed) of the Modal component',
		} );
	}
	// Disable reason: this stops mouse events from triggering tooltips and
	// other elements underneath the modal overlay.
	return createPortal(
		<ModalFrame
			ref={ ref }
			onRequestClose={ onRequestClose }
			aria={ {
				labelledby: headingId,
				describedby: aria.describedby,
			} }
			{ ...otherProps }
		>
			<div className={ 'components-modal__content' } role="document">
				<ModalHeader
					closeLabel={ closeButtonLabel }
					headingId={ title && headingId }
					icon={ icon }
					isDismissible={ isDismissible || isDismissable }
					onClose={ onRequestClose }
					title={ title }
				/>
				{ children }
			</div>
		</ModalFrame>,
		document.body
	);
}
