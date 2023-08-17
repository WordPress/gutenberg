export type SurfaceVariant =
	| 'primary'
	| 'secondary'
	| 'tertiary'
	| 'dotted'
	| 'grid';

export type SurfaceProps = {
	/**
	 * Determines the grid size for "dotted" and "grid" variants.
	 *
	 * @default 12
	 */
	backgroundSize?: number;
	/**
	 * Renders a bottom border.
	 *
	 * @default false
	 */
	borderBottom?: boolean;
	/**
	 * Renders a left border.
	 *
	 * @default false
	 */
	borderLeft?: boolean;
	/**
	 * Renders a right border.
	 *
	 * @default false
	 */
	borderRight?: boolean;
	/**
	 * Renders a top border.
	 *
	 * @default false
	 */
	borderTop?: boolean;
	/**
	 * Modifies the background color of `Surface`.
	 *
	 * * `primary`: Used for almost all cases.
	 * * `secondary`: Used as a secondary background for inner `Surface` components.
	 * * `tertiary`: Used as the app/site wide background. Visible in **dark mode** only. Use case is rare.
	 * * `grid`: Used to show a grid.
	 * * `dotted`: Used to show a dots grid.
	 *
	 * @default 'primary'
	 */
	variant?: SurfaceVariant;
	/**
	 * The children elements.
	 */
	children: React.ReactNode;
};
