/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { createPortal, useEffect, useRef } from '@wordpress/element';
import {
	useInstanceId,
	useFocusReturn,
	useFocusOnMount,
	__experimentalUseFocusOutside as useFocusOutside,
	useConstrainedTabbing,
	useMergeRefs,
} from '@wordpress/compose';
import deprecated from '@wordpress/deprecated';
import { ESCAPE } from '@wordpress/keycodes';
import { __ } from '@wordpress/i18n';
import { closeSmall } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import * as ariaHelper from './aria-helper';
import Button from '../button';

// Used to count the number of open modals.
let openModalCount = 0;

export default function Modal( {
	bodyOpenClassName = 'modal-open',
	role = 'dialog',
	title = null,
	focusOnMount = true,
	shouldCloseOnEsc = true,
	shouldCloseOnClickOutside = true,
	isDismissable, // Deprecated
	isDismissible = isDismissable || true,
	/* accessibility */
	aria = {
		labelledby: null,
		describedby: null,
	},
	onRequestClose,
	icon,
	closeButtonLabel,
	children,
	style,
	overlayClassName,
	className,
	contentLabel,
	onKeyDown,
} ) {
	const ref = useRef();
	const instanceId = useInstanceId( Modal );
	const headingId = title
		? `components-modal-header-${ instanceId }`
		: aria.labelledby;
	const focusOnMountRef = useFocusOnMount( focusOnMount );
	const constrainedTabbingRef = useConstrainedTabbing();
	const focusReturnRef = useFocusReturn();
	const focusOutsideProps = useFocusOutside( onRequestClose );

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

	if ( isDismissable ) {
		deprecated( 'isDismissable prop of the Modal component', {
			since: '5.4',
			alternative: 'isDismissible prop (renamed) of the Modal component',
		} );
	}

	function handleEscapeKeyDown( event ) {
		if (
			shouldCloseOnEsc &&
			event.keyCode === ESCAPE &&
			! event.defaultPrevented
		) {
			event.preventDefault();
			if ( onRequestClose ) {
				onRequestClose( event );
			}
		}
	}

	return createPortal(
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions
		<div
			ref={ ref }
			className={ classnames(
				'components-modal__screen-overlay',
				overlayClassName
			) }
			onKeyDown={ handleEscapeKeyDown }
		>
			<div
				className={ classnames( 'components-modal__frame', className ) }
				style={ style }
				ref={ useMergeRefs( [
					constrainedTabbingRef,
					focusReturnRef,
					focusOnMountRef,
				] ) }
				role={ role }
				aria-label={ contentLabel }
				aria-labelledby={ contentLabel ? null : headingId }
				aria-describedby={ aria.describedby }
				tabIndex="-1"
				{ ...( shouldCloseOnClickOutside ? focusOutsideProps : {} ) }
				onKeyDown={ onKeyDown }
			>
				<div className={ 'components-modal__content' } role="document">
					<div className="components-modal__header">
						<div className="components-modal__header-heading-container">
							{ icon && (
								<span
									className="components-modal__icon-container"
									aria-hidden
								>
									{ icon }
								</span>
							) }
							{ title && (
								<h1
									id={ headingId }
									className="components-modal__header-heading"
								>
									{ title }
								</h1>
							) }
						</div>
						{ isDismissible && (
							<Button
								onClick={ onRequestClose }
								icon={ closeSmall }
								label={
									closeButtonLabel || __( 'Close dialog' )
								}
							/>
						) }
					</div>
					{ children }
				</div>
			</div>
		</div>,
		document.body
	);
}
