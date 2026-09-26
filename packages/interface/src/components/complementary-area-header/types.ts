import type { ReactNode } from 'react';
import type { ComplementaryAreaToggleProps } from '../complementary-area-toggle/types';

export type ComplementaryAreaHeaderProps = {
	/**
	 * The content rendered before the close button.
	 */
	children?: ReactNode;
	/**
	 * A className passed to the header container.
	 */
	className?: string;
	/**
	 * Props passed to the button that closes the complementary area.
	 */
	toggleButtonProps: ComplementaryAreaToggleProps;
};
