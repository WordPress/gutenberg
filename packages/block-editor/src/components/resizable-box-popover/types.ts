import type { ComponentPropsWithoutRef } from 'react';
import type { ResizableBox } from '@wordpress/components';
import type BlockPopoverCover from '../block-popover/cover';

/**
 * Props of `ResizableBoxPopover`.
 */
export type ResizableBoxPopoverProps = Omit<
	ComponentPropsWithoutRef< typeof BlockPopoverCover >,
	'children'
> & {
	clientId: string;
	resizableBoxProps?: ComponentPropsWithoutRef< typeof ResizableBox >;
};
