/**
 * External dependencies
 */
import clsx from 'clsx';
import type {
	ForwardedRef,
	KeyboardEvent,
	MutableRefObject,
	UIEvent,
} from 'react';

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
	useLayoutEffect,
	createContext,
	useContext,
} from '@wordpress/element';
import {
	useInstanceId,
	useFocusReturn,
	useFocusOnMount,
	useConstrainedTabbing,
	useMergeRefs,
} from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { close } from '@wordpress/icons';
import { getScrollContainer } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import * as ariaHelper from './aria-helper';
import Button from '../button';
import StyleProvider from '../style-provider';
import type { ModalProps } from './types';
import { withIgnoreIMEEvents } from '../utils/with-ignore-ime-events';

// Used to track and dismiss the prior modal when another opens unless nested.
const ModalContext = createContext<
	MutableRefObject< ModalProps[ 'onRequestClose' ] | undefined >[]
>( [] );

// Used to track body class names applied while modals are open.
const bodyOpenClasses = new Map< string, number >();

function UnforwardedModal(
	props: ModalProps,
	forwardedRef: ForwardedRef< HTMLDivElement >
) {
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
			labelledby: undefined,
			describedby: undefined,
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
		size,
		headerActions = null,
		__experimentalHideHeader = false,
	} = props;

	const ref = useRef< HTMLDivElement >();

	const instanceId = useInstanceId( Modal );
	const headingId = title
		? `components-modal-header-${ instanceId }`
		: aria.labelledby;

	// The focus hook does not support 'firstContentElement' but this is a valid
	// value for the Modal's focusOnMount prop. The following code ensures the focus
	// hook will focus the first focusable node within the element to which it is applied.
	// When `firstContentElement` is passed as the value of the focusOnMount prop,
	// the focus hook is applied to the Modal's content element.
	// Otherwise, the focus hook is applied to the Modal's ref. This ensures that the
	// focus hook will focus the first element in the Modal's **content** when
	// `firstContentElement` is passed.
	const focusOnMountRef = useFocusOnMount(
		focusOnMount === 'firstContentElement' ? 'firstElement' : focusOnMount
	);
	const constrainedTabbingRef = useConstrainedTabbing();
	const focusReturnRef = useFocusReturn();
	const contentRef = useRef< HTMLDivElement >( null );
	const childrenContainerRef = useRef< HTMLDivElement >( null );

	const [ hasScrolledContent, setHasScrolledContent ] = useState( false );
	const [ hasScrollableContent, setHasScrollableContent ] = useState( false );

	let sizeClass;
	if ( isFullScreen || size === 'fill' ) {
		sizeClass = 'is-full-screen';
	} else if ( size ) {
		sizeClass = `has-size-${ size }`;
	}

	// Determines whether the Modal content is scrollable and updates the state.
	const isContentScrollable = useCallback( () => {
		if ( ! contentRef.current ) {
			return;
		}

		const closestScrollContainer = getScrollContainer( contentRef.current );

		if ( contentRef.current === closestScrollContainer ) {
			setHasScrollableContent( true );
		} else {
			setHasScrollableContent( false );
		}
	}, [ contentRef ] );

	// Accessibly isolates/unisolates the modal.
	useEffect( () => {
		ariaHelper.modalize( ref.current );
		return () => ariaHelper.unmodalize();
	}, [] );

	// Keeps a fresh ref for the subsequent effect.
	const refOnRequestClose = useRef< ModalProps[ 'onRequestClose' ] >();
	useEffect( () => {
		refOnRequestClose.current = onRequestClose;
	}, [ onRequestClose ] );

	// The list of `onRequestClose` callbacks of open (non-nested) Modals. Only
	// one should remain open at a time and the list enables closing prior ones.
	const dismissers = useContext( ModalContext );
	// Used for the tracking and dismissing any nested modals.
	const nestedDismissers = useRef< typeof dismissers >( [] );

	// Updates the stack tracking open modals at this level and calls
	// onRequestClose for any prior and/or nested modals as applicable.
	useEffect( () => {
		dismissers.push( refOnRequestClose );
		const [ first, second ] = dismissers;
		if ( second ) {
			first?.current?.();
		}

		const nested = nestedDismissers.current;
		return () => {
			nested[ 0 ]?.current?.();
			dismissers.shift();
		};
	}, [ dismissers ] );

	// Adds/removes the value of bodyOpenClassName to body element.
	useEffect( () => {
		const theClass = bodyOpenClassName;
		const oneMore = 1 + ( bodyOpenClasses.get( theClass ) ?? 0 );
		bodyOpenClasses.set( theClass, oneMore );
		document.body.classList.add( bodyOpenClassName );
		return () => {
			const oneLess = bodyOpenClasses.get( theClass )! - 1;
			if ( oneLess === 0 ) {
				document.body.classList.remove( theClass );
				bodyOpenClasses.delete( theClass );
			} else {
				bodyOpenClasses.set( theClass, oneLess );
			}
		};
	}, [ bodyOpenClassName ] );

	// Calls the isContentScrollable callback when the Modal children container resizes.
	useLayoutEffect( () => {
		if ( ! window.ResizeObserver || ! childrenContainerRef.current ) {
			return;
		}

		const resizeObserver = new ResizeObserver( isContentScrollable );
		resizeObserver.observe( childrenContainerRef.current );

		isContentScrollable();

		return () => {
			resizeObserver.disconnect();
		};
	}, [ isContentScrollable, childrenContainerRef ] );

	function handleEscapeKeyDown( event: KeyboardEvent< HTMLDivElement > ) {
		if (
			shouldCloseOnEsc &&
			( event.code === 'Escape' || event.key === 'Escape' ) &&
			! event.defaultPrevented
		) {
			event.preventDefault();
			if ( onRequestClose ) {
				onRequestClose( event );
			}
		}
	}

	const onContentContainerScroll = useCallback(
		( e: UIEvent< HTMLDivElement > ) => {
			const scrollY = e?.currentTarget?.scrollTop ?? -1;

			if ( ! hasScrolledContent && scrollY > 0 ) {
				setHasScrolledContent( true );
			} else if ( hasScrolledContent && scrollY <= 0 ) {
				setHasScrolledContent( false );
			}
		},
		[ hasScrolledContent ]
	);

	let pressTarget: EventTarget | null = null;
	const overlayPressHandlers: {
		onPointerDown: React.PointerEventHandler< HTMLDivElement >;
		onPointerUp: React.PointerEventHandler< HTMLDivElement >;
	} = {
		onPointerDown: ( event ) => {
			if ( event.target === event.currentTarget ) {
				pressTarget = event.target;
				// Avoids focus changing so that focus return works as expected.
				event.preventDefault();
			}
		},
		// Closes the modal with two exceptions. 1. Opening the context menu on
		// the overlay. 2. Pressing on the overlay then dragging the pointer
		// over the modal and releasing. Due to the modal being a child of the
		// overlay, such a gesture is a `click` on the overlay and cannot be
		// excepted by a `click` handler. Thus the tactic of handling
		// `pointerup` and comparing its target to that of the `pointerdown`.
		onPointerUp: ( { target, button } ) => {
			const isSameTarget = target === pressTarget;
			pressTarget = null;
			if ( button === 0 && isSameTarget ) {
				onRequestClose();
			}
		},
	};

	const modal = (
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions
		<div
			ref={ useMergeRefs( [ ref, forwardedRef ] ) }
			className={ clsx(
				'components-modal__screen-overlay',
				overlayClassName
			) }
			onKeyDown={ withIgnoreIMEEvents( handleEscapeKeyDown ) }
			{ ...( shouldCloseOnClickOutside ? overlayPressHandlers : {} ) }
		>
			<StyleProvider document={ document }>
				<div
					className={ clsx(
						'components-modal__frame',
						sizeClass,
						className
					) }
					style={ style }
					ref={ useMergeRefs( [
						constrainedTabbingRef,
						focusReturnRef,
						focusOnMount !== 'firstContentElement'
							? focusOnMountRef
							: null,
					] ) }
					role={ role }
					aria-label={ contentLabel }
					aria-labelledby={ contentLabel ? undefined : headingId }
					aria-describedby={ aria.describedby }
					tabIndex={ -1 }
					onKeyDown={ onKeyDown }
				>
					<div
						className={ clsx( 'components-modal__content', {
							'hide-header': __experimentalHideHeader,
							'is-scrollable': hasScrollableContent,
							'has-scrolled-content': hasScrolledContent,
						} ) }
						role="document"
						onScroll={ onContentContainerScroll }
						ref={ contentRef }
						aria-label={
							hasScrollableContent
								? __( 'Scrollable section' )
								: undefined
						}
						tabIndex={ hasScrollableContent ? 0 : undefined }
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
								{ headerActions }
								{ isDismissible && (
									<Button
										onClick={ onRequestClose }
										icon={ close }
										label={
											closeButtonLabel || __( 'Close' )
										}
									/>
								) }
							</div>
						) }

						<div
							ref={ useMergeRefs( [
								childrenContainerRef,
								focusOnMount === 'firstContentElement'
									? focusOnMountRef
									: null,
							] ) }
						>
							{ children }
						</div>
					</div>
				</div>
			</StyleProvider>
		</div>
	);

	return createPortal(
		<ModalContext.Provider value={ nestedDismissers.current }>
			{ modal }
		</ModalContext.Provider>,
		document.body
	);
}

/**
 * Modals give users information and choices related to a task they’re trying to
 * accomplish. They can contain critical information, require decisions, or
 * involve multiple tasks.
 *
 * ```jsx
 * import { Button, Modal } from '@wordpress/components';
 * import { useState } from '@wordpress/element';
 *
 * const MyModal = () => {
 *   const [ isOpen, setOpen ] = useState( false );
 *   const openModal = () => setOpen( true );
 *   const closeModal = () => setOpen( false );
 *
 *   return (
 *     <>
 *       <Button variant="secondary" onClick={ openModal }>
 *         Open Modal
 *       </Button>
 *       { isOpen && (
 *         <Modal title="This is my modal" onRequestClose={ closeModal }>
 *           <Button variant="secondary" onClick={ closeModal }>
 *             My custom close button
 *           </Button>
 *         </Modal>
 *       ) }
 *     </>
 *   );
 * };
 * ```
 */
export const Modal = forwardRef( UnforwardedModal );

export default Modal;
