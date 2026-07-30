import type { ControlProps } from '../types';
import type { SearchableSelectProps } from '../primitives/searchable-select/types';

export type SearchableSelectControlProps = SearchableSelectProps &
	ControlProps & {
		/**
		 * CSS class to apply.
		 */
		className?: string;
	};
