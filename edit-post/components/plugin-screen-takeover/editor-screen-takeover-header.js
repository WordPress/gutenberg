import { NavigableToolbar } from '../../../editor/components';
import { IconButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const ScreenTakeoverHeader = ( { icon, title, onClose, closeLabel } ) => {
	const label = closeLabel ? closeLabel : __( 'Close window' );

	return (
		<NavigableToolbar
			className={ 'edit-post-plugin-screen-takeover__editor-screen-takeover-header' }
		>
			<div>
				{ icon }
				<span>
					{ title }
				</span>
			</div>
			<IconButton
				onClick={ onClose }
				icon="no-alt"
				label={ label }
			/>
		</NavigableToolbar>
	);
};

export default ScreenTakeoverHeader;
