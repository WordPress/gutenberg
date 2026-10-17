import type { MouseEvent } from 'react';

/**
 * Props the inserter passes to its toggle, or to `renderToggle`.
 */
export interface InserterToggleRenderProps {
	onToggle: ( event?: MouseEvent ) => void;
	disabled?: boolean;
	isOpen?: boolean;
	blockTitle: string;
	hasSingleBlockType?: boolean;
	appenderLabel?: string;
	toggleProps?: Record< string, unknown >;
}
