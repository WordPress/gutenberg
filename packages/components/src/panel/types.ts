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

export type PanelBodyProps = {
	/**
	 * Props that are passed to the Button component in the PanelBodyTitle within the panel body.
	 *
	 * @default {};
	 */
	buttonProps?: object;
	/**
	 * The content to display within the panel body.
	 *  If the children is a Function, it will be called with an object with the opened property and return its value.
	 */
	children?: React.ReactNode | ( ( {} ) => React.ReactNode );
	/**
	 * The CSS class to apply to the wrapper element.
	 */
	className?: string;
	/**
	 * An icon to be shown next to the PanelBody title.
	 */
	icon?: JSX.Element;
	/**
	 * Whether or not the panel will start open.
	 */
	initialOpen?: boolean;
	/**
	 * A function that is called when the user clicks on the PanelBody title after the open state is changed.
	 *
	 * @default true;
	 */
	onToggle?: ( next: boolean ) => void;
	/**
	 * If opened is true then the Panel will remain open regardless of the initialOpen prop and the panel will be prevented from being closed.
	 */
	opened?: boolean;
	/**
	 * Title of the PanelBody. This shows even when it is closed.
	 */
	title?: string;
	/**
	 * Scrolls the content into view when visible.
	 * This improves the UX when there are multiple stacking Panel Body components.
	 * components in a scrollable container.
	 *
	 * @default true;
	 */
	scrollAfterOpen?: boolean;
};
