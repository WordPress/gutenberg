/**
 * External dependencies
 */
import type {
	AriaRole,
	CSSProperties,
	ReactNode,
	KeyboardEventHandler,
	KeyboardEvent,
	SyntheticEvent,
} from 'react';

/**
 * WordPress dependencies
 */
import type { useFocusOnMount } from '@wordpress/compose';

export type ModalProps = {
	aria?: {
		/**
		 * If this property is added, it will be added to the modal content
		 * `div` as `aria-describedby`.
		 */
		describedby?: string;
		/**
		 * If this property is added, it will be added to the modal content
		 * `div` as `aria-labelledby`. Use this when you are rendering the title
		 * yourself within the modal's content area instead of using the `title`
		 * prop. This ensures the title is usable by assistive technology.
		 *
		 * Titles are required for accessibility reasons, see `contentLabel` and
		 * `title` for other ways to provide a title.
		 */
		labelledby?: string;
	};
	/**
	 * Class name added to the body element when the modal is open.
	 *
	 * @default 'modal-open'
	 */
	bodyOpenClassName?: string;
	/**
	 * The children elements.
	 */
	children: ReactNode;
	/**
	 * If this property is added, it will an additional class name to the modal
	 * content `div`.
	 */
	className?: string;
	/**
	 * Label on the close button.
	 *
	 * @default `__( 'Close' )`
	 */
	closeButtonLabel?: string;
	/**
	 * If this property is added, it will be added to the modal content `div` as
	 * `aria-label`.
	 *
	 * Titles are required for accessibility reasons, see `aria.labelledby` and
	 * `title` for other ways to provide a title.
	 */
	contentLabel?: string;
	/**
	 * If this property is true, it will focus the first tabbable element
	 * rendered in the modal.
	 *
	 * @default true
	 */
	focusOnMount?: Parameters< typeof useFocusOnMount >[ 0 ];
	/**
	 * If this property is added, an icon will be added before the title.
	 */
	icon?: JSX.Element;
	/**
	 * If this property is set to false, the modal will not display a close icon
	 * and cannot be dismissed.
	 *
	 * @default true
	 */
	isDismissible?: boolean;
	/**
	 * This property when set to `true` will render a full screen modal.
	 *
	 * @default false
	 */
	isFullScreen?: boolean;
	/**
	 *  Handle the key down on the modal frame `div`.
	 */
	onKeyDown?: KeyboardEventHandler< HTMLDivElement >;
	/**
	 * This function is called to indicate that the modal should be closed.
	 */
	onRequestClose: (
		event?: KeyboardEvent< HTMLDivElement > | SyntheticEvent
	) => void;
	/**
	 * If this property is added, it will an additional class name to the modal
	 * overlay `div`.
	 */
	overlayClassName?: string;
	/**
	 * If this property is added, it will override the default role of the
	 * modal.
	 *
	 * @default 'dialog'
	 */
	role?: AriaRole;
	/**
	 * If this property is added, it will determine whether the modal requests
	 * to close when a mouse click occurs outside of the modal content.
	 *
	 * @default true
	 */
	shouldCloseOnClickOutside?: boolean;
	/**
	 * If this property is added, it will determine whether the modal requests
	 * to close when the escape key is pressed.
	 *
	 * @default true
	 */
	shouldCloseOnEsc?: boolean;
	/**
	 * If this property is added, it will be added to the modal frame `div`.
	 */
	style?: CSSProperties;
	/**
	 * This property is used as the modal header's title.
	 *
	 * Titles are required for accessibility reasons, see `aria.labelledby` and
	 * `contentLabel` for other ways to provide a title.
	 */
	title?: string;
	/**
	 * When set to `true`, the Modal's header (including the icon, title and
	 * close button) will not be rendered.
	 *
	 * _Warning_: This property is still experimental. “Experimental” means this
	 * is an early implementation subject to drastic and breaking changes.
	 *
	 * @default false
	 */
	__experimentalHideHeader?: boolean;
};
