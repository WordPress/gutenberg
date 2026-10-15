import { useViewportMatch } from '@wordpress/compose';

/**
 * Props for a ToolsPanel's dropdown menu that place its popover beside the
 * inspector on larger screens.
 */
export function useToolsPanelDropdownMenuProps() {
	const isMobile = useViewportMatch( 'medium', '<' );
	return ! isMobile
		? {
				popoverProps: {
					placement: 'left-start' as const,
					// For non-mobile, inner sidebar width (248px) - button width (24px) - border (1px) + padding (16px) + spacing (20px)
					offset: 259,
				},
			}
		: {};
}
