/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import IconButton from '../icon-button';

const DialogHeader = ( { icon, title, onClose, closeLabel, headingId, isDismissable } ) => {
	const label = closeLabel ? closeLabel : __( 'Close dialog' );

	return (
		<div
			className="components-dialog__header"
		>
			<div className="components-dialog__header-heading-container">
				{ icon &&
					<span className="components-dialog__icon-container" aria-hidden>
						{ icon }
					</span>
				}
				{ title &&
					<h1 id={ headingId }
						className="components-dialog__header-heading">
						{ title }
					</h1>
				}
			</div>
			{ isDismissable &&
				<IconButton
					onClick={ onClose }
					icon="no-alt"
					label={ label }
				/>
			}
		</div>
	);
};

export default DialogHeader;
