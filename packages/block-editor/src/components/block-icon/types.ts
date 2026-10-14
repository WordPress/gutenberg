import type { BlockTypeIcon } from '@wordpress/blocks';

export interface BlockIconProps {
	icon?: BlockTypeIcon | null;
	showColors?: boolean;
	className?: string;
	context?: string;
}
