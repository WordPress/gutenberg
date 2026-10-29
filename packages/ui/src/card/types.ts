import type { ReactNode } from 'react';
import type { ComponentProps } from '../utils/types';

export interface RootProps extends ComponentProps< 'div' > {
	/**
	 * The content to be rendered inside the card.
	 */
	children?: ReactNode;
}

export interface HeaderProps extends ComponentProps< 'div' > {
	/**
	 * The content to be rendered inside the header.
	 */
	children?: ReactNode;
}

export interface ContentProps extends ComponentProps< 'div' > {
	/**
	 * The content to be rendered inside the content area.
	 */
	children?: ReactNode;
}

export interface FullBleedProps extends ComponentProps< 'div' > {
	/**
	 * The content to be rendered edge-to-edge, breaking out of the
	 * card's padding.
	 */
	children?: ReactNode;
}

export interface TitleProps extends ComponentProps< 'div' > {
	/**
	 * The title text for the card.
	 */
	children?: ReactNode;
}
