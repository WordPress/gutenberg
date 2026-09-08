import { forwardRef } from '@wordpress/element';
import { check, copy, error } from '@wordpress/icons';
import { Icon } from '../icon';
import type { CopyToClipboardStatus } from '../copy-to-clipboard/types';
import type { IconProps } from '../icon/types';
import type { ClipboardIconProps } from './types';

const STATUS_ICONS: Record< CopyToClipboardStatus, IconProps[ 'icon' ] > = {
	pending: copy,
	success: check,
	error,
};

export function getClipboardStatusIcon(
	status: CopyToClipboardStatus
): IconProps[ 'icon' ] {
	return STATUS_ICONS[ status ];
}

/**
 * An icon that reflects copy status: copy when pending, check when successful,
 * and an error mark when copying fails.
 *
 * Meant to be composed with `CopyToClipboard` or used inside `ClipboardButton`.
 *
 * ```jsx
 * import { ClipboardIcon, CopyToClipboard } from '@wordpress/ui';
 *
 * function MyClipboardIcon() {
 * 	return (
 * 		<CopyToClipboard text="Text to copy">
 * 			{ ( status ) => (
 * 				<button type="button" aria-label="Copy">
 * 					<ClipboardIcon status={ status } />
 * 				</button>
 * 			) }
 * 		</CopyToClipboard>
 * 	);
 * }
 * ```
 */
export const ClipboardIcon = forwardRef< SVGSVGElement, ClipboardIconProps >(
	function ClipboardIcon( { status, ...props }, ref ) {
		return (
			<Icon
				ref={ ref }
				icon={ getClipboardStatusIcon( status ) }
				{ ...props }
			/>
		);
	}
);
