/**
 * Internal dependencies
 */
import type { ButtonAsButtonProps } from '../button/types';
import type { WordPressComponentProps } from '../ui/context';

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
	 * Props that are passed to the `Button` component in title within the
	 * `PanelBody`.
	 *
	 * @default {}
	 */
	buttonProps?: WordPressComponentProps<
		Omit< ButtonAsButtonProps, 'icon' >,
		'button',
		false
	>;
	/**
	 * The content to display in the `PanelBody`.If a function is provided for
	 * this prop, it will receive an object with the `opened` prop as an argument.
	 */
	children?:
		| React.ReactNode
		| ( ( props: { opened: boolean } ) => React.ReactNode );

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
	 * @default noop
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
	 * @default true
	 */
	scrollAfterOpen?: boolean;
};

export type PanelBodyTitleProps = Omit< ButtonAsButtonProps, 'icon' > & {
	/**
	 * An icon to be shown next to the PanelBody title.
	 */
	icon?: JSX.Element;
	/**
	 * Whether or not the panel body is currently opened or not.
	 */
	isOpened?: boolean;
	/**
	 * The title text.
	 */
	title?: string;
};
