/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useState, Children } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Modal from '../modal';
import KeyboardShortcuts from '../keyboard-shortcuts';
import Button from '../button';
import PageControl from './page-control';
import { BackButtonIcon, ForwardButtonIcon } from './icons';
import FinishButton from './finish-button';

export default function Guide( {
	children,
	className,
	contentLabel,
	finishButtonText,
	onFinish,
} ) {
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

	if ( numberOfPages === 0 ) {
		return null;
	}

	return (
		<Modal
			className={ classnames( 'components-guide', className ) }
			contentLabel={ contentLabel }
			onRequestClose={ onFinish }
		>
			<KeyboardShortcuts
				key={ currentPage }
				shortcuts={ {
					left: goBack,
					right: goForward,
				} }
			/>

			<div className="components-guide__container">
				{ children[ currentPage ] }

				{ ! canGoForward && (
					<FinishButton
						className="components-guide__inline-finish-button"
						onClick={ onFinish }
					>
						{ finishButtonText || __( 'Finish' ) }
					</FinishButton>
				) }

				<div className="components-guide__footer">
					{ canGoBack && (
						<Button
							className="components-guide__back-button"
							icon={ <BackButtonIcon /> }
							onClick={ goBack }
						>
							{ __( 'Previous' ) }
						</Button>
					) }
					<PageControl
						currentPage={ currentPage }
						numberOfPages={ numberOfPages }
						setCurrentPage={ setCurrentPage }
					/>
					{ canGoForward && (
						<Button
							className="components-guide__forward-button"
							icon={ <ForwardButtonIcon /> }
							onClick={ goForward }
						>
							{ __( 'Next' ) }
						</Button>
					) }
					{ ! canGoForward && (
						<FinishButton
							className="components-guide__finish-button"
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
