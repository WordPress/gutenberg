/**
 * WordPress dependencies
 */
import { Modal } from '@wordpress/components';

function MoreMenuModal( props ) {
	return (
		<Modal
			{ ...props }
			onFocusLoss={ () => {
				const button = document.querySelector( '.edit-post-more-menu button' );
				if ( button ) {
					button.focus();
				}
			} }
		/>
	);
}

export default MoreMenuModal;
