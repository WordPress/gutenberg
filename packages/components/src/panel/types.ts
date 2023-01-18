export type PanelHeaderProps = {
	/**
	 * The text that will be rendered as the title of the `Panel`.
	 * Will be rendered in an `<h2>` tag.
	 */
	label?: string;
	/**
	 * The content to display within the panel header.
	 */
	children?: React.ReactNode;
};

export type PanelRowProps = {
	/**
	 * The CSS class to apply to the wrapper element.
	 */
	className?: string;
	/**
	 * The content to display within the panel row.
	 */
	children: React.ReactNode;
};
