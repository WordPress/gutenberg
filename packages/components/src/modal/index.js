// @ts-nocheck

/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	createPortal,
	useCallback,
	useEffect,
	useRef,
	useState,
	forwardRef,
} from '@wordpress/element';
import {
	useInstanceId,
	useFocusReturn,
	useFocusOnMount,
	__experimentalUseFocusOutside as useFocusOutside,
	useConstrainedTabbing,
	useMergeRefs,
} from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { close } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import * as ariaHelper from './aria-helper';
import Button from '../button';
import StyleProvider from '../style-provider';

// Used to count the number of open modals.
let openModalCount = 0;

function Modal( props, forwardedRef ) {
	const {
		bodyOpenClassName = 'modal-open',
		role = 'dialog',
		title = null,
		focusOnMount = true,
		shouldCloseOnEsc = true,
		shouldCloseOnClickOutside = true,
		isDismissible = true,
		/* Accessibility. */
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
		isFullScreen = false,
		__experimentalHideHeader = false,
	} = props;

	const ref = useRef();
	const instanceId = useInstanceId( Modal );
	const headingId = title
		? `components-modal-header-${ instanceId }`
		: aria.labelledby;
	const focusOnMountRef = useFocusOnMount( focusOnMount );
	const constrainedTabbingRef = useConstrainedTabbing();
	const focusReturnRef = useFocusReturn();
	const focusOutsideProps = useFocusOutside( onRequestClose );

	const [ hasScrolledContent, setHasScrolledContent ] = useState( false );

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
	}, [ bodyOpenClassName ] );

	function handleEscapeKeyDown( event ) {
		if (
			shouldCloseOnEsc &&
			event.code === 'Escape' &&
			! event.defaultPrevented
		) {
			event.preventDefault();
			if ( onRequestClose ) {
				onRequestClose( event );
			}
		}
	}

	const onContentContainerScroll = useCallback(
		( e ) => {
			const scrollY = e?.target?.scrollTop ?? -1;

			if ( ! hasScrolledContent && scrollY > 0 ) {
				setHasScrolledContent( true );
			} else if ( hasScrolledContent && scrollY <= 0 ) {
				setHasScrolledContent( false );
			}
		},
		[ hasScrolledContent ]
	);

	return createPortal(
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions
		<div
			ref={ useMergeRefs( [ ref, forwardedRef ] ) }
			className={ classnames(
				'components-modal__screen-overlay',
				overlayClassName
			) }
			onKeyDown={ handleEscapeKeyDown }
		>
			<StyleProvider document={ document }>
				<div
					className={ classnames(
						'components-modal__frame',
						className,
						{
							'is-full-screen': isFullScreen,
						}
					) }
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
					{ ...( shouldCloseOnClickOutside
						? focusOutsideProps
						: {} ) }
					onKeyDown={ onKeyDown }
				>
					<div
						className={ classnames( 'components-modal__content', {
							'hide-header': __experimentalHideHeader,
							'has-scrolled-content': hasScrolledContent,
						} ) }
						role="document"
						onScroll={ onContentContainerScroll }
					>
						{ ! __experimentalHideHeader && (
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
										icon={ close }
										label={
											closeButtonLabel ||
											__( 'Close dialog' )
										}
									/>
								) }
							</div>
						) }
						{ children }
					</div>
				</div>
			</StyleProvider>
		</div>,
		document.body
	);
}

export default forwardRef( Modal );
