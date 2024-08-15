/**
 * Internal dependencies
 */
import type { ButtonAsButtonProps } from '../button/types';
import type { WordPressComponentProps } from '../context';

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
	 * An icon to be shown next to the title.
	 */
	icon?: JSX.Element;
	/**
	 * Whether or not the panel will start open.
	 */
	initialOpen?: boolean;
	/**
	 * A function that is called any time the component is toggled from its closed
	 * state to its opened state, or vice versa.
	 *
	 * @default noop
	 */
	onToggle?: ( next: boolean ) => void;
	/**
	 * When set to `true`, the component will remain open regardless of the
	 * `initialOpen` prop and the panel will be prevented from being closed.
	 */
	opened?: boolean;
	/**
	 * Title text. It shows even when it is closed.
	 */
	title?: string;
	/**
	 * Scrolls the content into view when visible. This improves the UX when
	 * multiple `PanelBody` components are stacked in a scrollable container.
	 *
	 * @default true
	 */
	scrollAfterOpen?: boolean;
};

export type PanelBodyTitleProps = Omit< ButtonAsButtonProps, 'icon' > & {
	/**
	 * An icon to be shown next to the title.
	 */
	icon?: JSX.Element;
	/**
	 * Whether or not the `PanelBody` is currently opened or not.
	 */
	isOpened?: boolean;
	/**
	 * The title text.
	 */
	title?: string;
};
