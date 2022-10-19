/**
 * WordPress dependencies
 */
import { Spinner, Modal } from '@wordpress/components';

export default function TemplateActionsLoadingScreen() {
	const baseCssClass = 'edit-site-template-actions-loading-screen-modal';
	return (
		<Modal
			isFullScreen
			isDismissible={ false }
			shouldCloseOnClickOutside={ false }
			shouldCloseOnEsc={ false }
			onRequestClose={ () => {} }
			__experimentalHideHeader
			className={ baseCssClass }
		>
			<div className={ `${ baseCssClass }__content` }>
				<Spinner />
			</div>
		</Modal>
	);
}
