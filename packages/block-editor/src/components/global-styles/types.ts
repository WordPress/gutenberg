import type { ComponentProps } from 'react';
import type { Dropdown } from '@wordpress/components';

export type ToolsPanelPopoverProps = Pick<
	NonNullable< ComponentProps< typeof Dropdown >[ 'popoverProps' ] >,
	'placement' | 'offset' | 'shift'
>;
