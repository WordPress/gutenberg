import type { ComponentType, ElementType } from 'react';

export interface BlockListAppenderProps {
	rootClientId?: string | null;
	/** Rendered in place of the default appender. */
	CustomAppender?: ComponentType | false;
	className?: string;
	tagName?: ElementType;
}
