import type { StyledBlockAttributes } from '../utils/types';

export type CommentsPaginationNumbersAttributes = StyledBlockAttributes;

export interface PaginationItemProps {
	content: string;
	tag?: 'a' | 'span';
	extraClass?: string;
}
