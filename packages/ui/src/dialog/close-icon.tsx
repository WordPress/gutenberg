import { Dialog as _Dialog } from '@base-ui/react/dialog';
import { forwardRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { close } from '@wordpress/icons';
import { IconButton } from '../icon-button';
import type { CloseIconProps } from './types';

/**
 * Renders an icon button that closes the dialog when clicked.
 * Provides a default close icon and accessible label.
 */
const CloseIcon = forwardRef< HTMLButtonElement, CloseIconProps >(
	function DialogCloseIcon( props, ref ) {
		return (
			<_Dialog.Close
				ref={ ref }
				render={
					<IconButton
						variant="minimal"
						size="compact"
						tone="neutral"
						{ ...props }
						icon={ close }
						label={ __( 'Close' ) }
					/>
				}
			/>
		);
	}
);

export { CloseIcon };
