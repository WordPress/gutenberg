import type { StyledBlockAttributes } from '../utils/types';

export interface QueryTitleAttributes extends StyledBlockAttributes {
	className?: string;
	type?: string;
	level?: number;
	levelOptions?: number[];
	showPrefix?: boolean;
	showSearchTerm?: boolean;
}

export interface QueryTitleBlockContext {
	query?: {
		postType?: string;
	};
}
