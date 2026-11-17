import type { ControlProps } from '../types';
import type { SearchableChipSelectProps } from '../primitives/searchable-chip-select/types';

export type SearchableChipSelectControlProps = SearchableChipSelectProps &
	ControlProps & {
		/**
		 * CSS class to apply.
		 */
		className?: string;
	};
