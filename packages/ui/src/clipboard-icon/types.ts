import type { CopyToClipboardStatus } from '../copy-to-clipboard/types';
import type { IconProps } from '../icon/types';

export interface ClipboardIconProps extends Omit< IconProps, 'icon' > {
	/**
	 * Copy status used to choose the pending, success, or error icon.
	 */
	status: CopyToClipboardStatus;
}
