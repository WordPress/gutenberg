/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useState, Children } from '@wordpress/element';
import { Modal, KeyboardShortcuts, IconButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import PageControl from './page-control';
import { BackButtonIcon, ForwardButtonIcon } from './icons';
import FinishButton from './finish-button';

function Guide( { className, onFinish, finishButtonText, children } ) {
	const isMobile = useSelect( ( select ) =>
		select( 'core/viewport' ).isViewportMatch( '< small' ) );

	const [ currentPage, setCurrentPage ] = useState( 0 );

	const numberOfPages = Children.count( children );
	const canGoBack = currentPage > 0;
	const canGoForward = currentPage < numberOfPages - 1;

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

	return (
		<Modal className={ classnames( 'nux-guide', className ) } onRequestClose={ onFinish }>

			<KeyboardShortcuts key={ currentPage } shortcuts={ {
				left: goBack,
				right: goForward,
			} } />

			<div className="nux-guide__container">

				{ children[ currentPage ] }

				{ isMobile && ! canGoForward && (
					<FinishButton onClick={ onFinish }>
						{ finishButtonText || __( 'Finish' ) }
					</FinishButton>
				) }

				<div className="nux-guide__footer">
					{ canGoBack && (
						<IconButton
							className="nux-guide__back-button"
							icon={ <BackButtonIcon /> }
							onClick={ goBack }
						>
							{ __( 'Previous' ) }
						</IconButton>
					) }
					<PageControl
						currentPage={ currentPage }
						numberOfPages={ numberOfPages }
						setCurrentPage={ setCurrentPage }
					/>
					{ canGoForward && (
						<IconButton
							className="nux-guide__forward-button"
							icon={ <ForwardButtonIcon /> }
							onClick={ goForward }
						>
							{ __( 'Next' ) }
						</IconButton>
					) }
					{ ! isMobile && ! canGoForward && (
						<FinishButton
							className="nux-guide__finish-button"
							onClick={ onFinish }
						>
							{ finishButtonText || __( 'Finish' ) }
						</FinishButton>
					) }
				</div>

			</div>

		</Modal>
	);
}

function Page( props ) {
	return <div { ...props } />;
}

Guide.Page = Page;

export default Guide;
