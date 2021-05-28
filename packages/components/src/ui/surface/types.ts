export type SurfaceVariant =
	| 'primary'
	| 'secondary'
	| 'tertiary'
	| 'dotted'
	| 'grid';

export type Props = {
	/**
	 * Determines the grid size for "dotted" and "grid" variants.
	 */
	backgroundSize?: number;
	/**
	 * Renders a border around the entire `Surface`.
	 */
	border?: boolean;
	/**
	 * Renders a bottom border.
	 */
	borderBottom?: boolean;
	/**
	 * Renders a left border.
	 */
	borderLeft?: boolean;
	/**
	 * Renders a right border.
	 */
	borderRight?: boolean;
	/**
	 * Renders a top border.
	 */
	borderTop?: boolean;
	/**
	 * Modifies the background color of `Surface`.
	 *
	 * * `primary`: Used for almost all cases.
	 * * `secondary`: Used as a secondary background for inner `Surface` components.
	 * * `tertiary`: Used as the app/site wide background. Visible in **dark mode** only. Use case is rare.
	 */
	variant?: SurfaceVariant;
	/**
	 * The children elements.
	 */
	children: React.ReactNode;
};
