import { IconButton } from '@wordpress/components';
import './style.scss';
import { __ } from '@wordpress/i18n';

const ModalHeader = ( { icon, title, onClose, closeLabel } ) => {
	const label = closeLabel ? closeLabel : __( 'Close window' );

	return (
		<div
			className={ 'edit-post-plugin-modal__editor-modal-header' }
		>
			<div>
				<span aria-hidden="true">
					{ icon }
				</span>
				<h1 id="modalID" >
					{ title }
				</h1>
			</div>
			<IconButton
				onClick={ onClose }
				icon="no-alt"
				label={ label }
			/>
		</div>
	);
};

export default ModalHeader;
