/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useState, useEffect, Children, useRef } from '@wordpress/element';
import deprecated from '@wordpress/deprecated';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Modal from '../modal';
import Button from '../button';
import PageControl from './page-control';
import type { GuideProps } from './types';

/**
 * `Guide` is a React component that renders a _user guide_ in a modal. The guide consists of several pages which the user can step through one by one. The guide is finished when the modal is closed or when the user clicks _Finish_ on the last page of the guide.
 *
 * ```jsx
 * function MyTutorial() {
 * 	const [ isOpen, setIsOpen ] = useState( true );
 *
 * 	if ( ! isOpen ) {
 * 		return null;
 * 	}
 *
 * 	return (
 * 		<Guide
 * 			onFinish={ () => setIsOpen( false ) }
 * 			pages={ [
 * 				{
 * 					content: <p>Welcome to the ACME Store!</p>,
 * 				},
 * 				{
 * 					image: <img src="https://acmestore.com/add-to-cart.png" />,
 * 					content: (
 * 						<p>
 * 							Click <i>Add to Cart</i> to buy a product.
 * 						</p>
 * 					),
 * 				},
 * 			] }
 * 		/>
 * 	);
 * }
 * ```
 */
function Guide( {
	children,
	className,
	contentLabel,
	finishButtonText = __( 'Finish' ),
	onFinish,
	pages = [],
}: GuideProps ) {
	const ref = useRef< HTMLDivElement >( null );
	const [ currentPage, setCurrentPage ] = useState( 0 );

	useEffect( () => {
		// Place focus at the top of the guide on mount and when the page changes.
		const frame = ref.current?.querySelector( '.components-guide' );
		if ( frame instanceof HTMLElement ) {
			frame.focus();
		}
	}, [ currentPage ] );

	useEffect( () => {
		if ( Children.count( children ) ) {
			deprecated( 'Passing children to <Guide>', {
				since: '5.5',
				alternative: 'the `pages` prop',
			} );
		}
	}, [ children ] );

	if ( Children.count( children ) ) {
		pages =
			Children.map( children, ( child ) => ( {
				content: child,
			} ) ) ?? [];
	}

	const canGoBack = currentPage > 0;
	const canGoForward = currentPage < pages.length - 1;

	const goBack = () => {
		if ( canGoBack ) {
			setCurrentPage( currentPage - 1 );
		}
	};

	const goForward = () => {
		if ( canGoForward ) {
			setCurrentPage( currentPage + 1 );
		}
	};

	if ( pages.length === 0 ) {
		return null;
	}

	return (
		<Modal
			className={ clsx( 'components-guide', className ) }
			contentLabel={ contentLabel }
			isDismissible={ pages.length > 1 }
			onRequestClose={ onFinish }
			onKeyDown={ ( event ) => {
				if ( event.code === 'ArrowLeft' ) {
					goBack();
					// Do not scroll the modal's contents.
					event.preventDefault();
				} else if ( event.code === 'ArrowRight' ) {
					goForward();
					// Do not scroll the modal's contents.
					event.preventDefault();
				}
			} }
			ref={ ref }
		>
			<div className="components-guide__container">
				<div className="components-guide__page">
					{ pages[ currentPage ].image }

					{ pages.length > 1 && (
						<PageControl
							currentPage={ currentPage }
							numberOfPages={ pages.length }
							setCurrentPage={ setCurrentPage }
						/>
					) }

					{ pages[ currentPage ].content }
				</div>

				<div className="components-guide__footer">
					{ canGoBack && (
						<Button
							className="components-guide__back-button"
							variant="tertiary"
							onClick={ goBack }
							__next40pxDefaultSize
						>
							{ __( 'Previous' ) }
						</Button>
					) }
					{ canGoForward && (
						<Button
							className="components-guide__forward-button"
							variant="primary"
							onClick={ goForward }
							__next40pxDefaultSize
						>
							{ __( 'Next' ) }
						</Button>
					) }
					{ ! canGoForward && (
						<Button
							className="components-guide__finish-button"
							variant="primary"
							onClick={ onFinish }
						>
							{ finishButtonText }
						</Button>
					) }
				</div>
			</div>
		</Modal>
	);
}

export default Guide;
