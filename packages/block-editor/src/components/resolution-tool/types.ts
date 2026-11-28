import type { ComponentProps } from 'react';
import type { __experimentalToolsPanelItem as ToolsPanelItem } from '@wordpress/components';

/**
 * An image size option of `ResolutionTool`.
 */
export interface ResolutionOption {
	label: string;
	value: string;
	disabled?: boolean;
}

/**
 * Props of `ResolutionTool`.
 */
export interface ResolutionToolProps {
	panelId?: string;
	/**
	 * Currently selected resolution value.
	 */
	value?: string;
	/**
	 * Called with the selected resolution value.
	 */
	onChange: ( value: string ) => void;
	options?: ResolutionOption[];
	defaultValue?: string;
	isShownByDefault?: boolean;
	resetAllFilter?: ComponentProps<
		typeof ToolsPanelItem
	>[ 'resetAllFilter' ];
}
