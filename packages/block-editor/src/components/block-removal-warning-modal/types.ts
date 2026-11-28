import type { BlockRemovalRule } from '../../store/types';

export interface BlockRemovalWarningModalProps {
	/** Rules deciding which block removals need confirmation. */
	rules: BlockRemovalRule[];
}
