import type { ReactNode } from 'react';

export type TextDirection = 'ltr' | 'rtl';

export interface DirectionProviderProps {
	/**
	 * The content to render within the direction context.
	 */
	children?: ReactNode;

	/**
	 * The text direction to provide to descendant components.
	 *
	 * @default 'ltr'
	 */
	direction?: TextDirection;
}
