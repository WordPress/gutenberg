export type PanelProps = {
	/**
	 * The text that will be rendered as the title of the panel.
	 * Text will be rendered inside an `<h2>` tag.
	 */
	header?: PanelHeaderProps[ 'label' ];
	/**
	 * The CSS class to apply to the wrapper element.
	 */
	className?: string;
	/**
	 * The content to display within the panel.
	 */
	children: React.ReactNode;
};

export type PanelHeaderProps = {
	/**
	 * The text that will be rendered as the title of the panel.
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
