import type { FocusEventHandler } from 'react';
import type { Block } from '@wordpress/blocks';

export interface ButtonBlockAppenderProps {
	rootClientId?: string | null;
	className?: string;
	onFocus?: FocusEventHandler;
	tabIndex?: number;
	/** Called with the inserted block, or with nothing when closed. */
	onSelect?: ( block?: Block ) => void;
}
