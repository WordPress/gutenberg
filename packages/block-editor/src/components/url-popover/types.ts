import type {
	ComponentProps,
	ForwardRefExoticComponent,
	MouseEventHandler,
	ReactNode,
	RefAttributes,
} from 'react';
import type { MenuItem, Popover } from '@wordpress/components';
import type { URLInputProps } from '../url-input/types';

/**
 * Props of `URLPopover`.
 */
export type URLPopoverProps = ComponentProps< typeof Popover > & {
	/**
	 * Controls rendered below the input row, hidden while the settings are
	 * shown.
	 */
	additionalControls?: ReactNode;
	/**
	 * Renders the settings, which a toggle shows and hides.
	 */
	renderSettings?: ( () => ReactNode ) | null;
};

/**
 * Props of `URLPopover.LinkEditor`.
 */
export type URLPopoverLinkEditorProps = Omit<
	ComponentProps< 'form' >,
	'value'
> & {
	autocompleteRef?: URLInputProps[ 'autocompleteRef' ];
	onChangeInputValue: URLInputProps[ 'onChange' ];
	value?: string;
};

/**
 * Props of `URLPopover.LinkViewerURL`.
 */
export interface URLPopoverLinkViewerURLProps {
	url?: string;
	urlLabel?: string;
	className?: string;
}

/**
 * Props of `URLPopover.LinkViewer`.
 */
export type URLPopoverLinkViewerProps = ComponentProps< 'div' > & {
	linkClassName?: string;
	onEditLinkClick?: MouseEventHandler< HTMLButtonElement >;
	url?: string;
	urlLabel?: string;
};

/**
 * `URLPopover`, with its link editor and viewer.
 */
export type URLPopoverComponent = ForwardRefExoticComponent<
	URLPopoverProps & RefAttributes< HTMLDivElement >
> & {
	LinkEditor: ( props: URLPopoverLinkEditorProps ) => ReactNode;
	LinkViewer: ( props: URLPopoverLinkViewerProps ) => ReactNode;
};

/**
 * Link attributes changed by `ImageURLInputUI`.
 */
export interface ImageURLInputUIChange {
	href?: string;
	linkDestination?: string;
	lightbox?: { enabled: boolean };
	linkTarget?: string;
	rel?: string;
	linkClass?: string;
}

/**
 * A link destination offered by `ImageURLInputUI`.
 */
export interface ImageLinkDestination {
	linkDestination: string;
	title: string;
	url?: string;
	icon: ComponentProps< typeof MenuItem >[ 'icon' ];
}

/**
 * Props of `ImageURLInputUI`.
 */
export interface ImageURLInputUIProps {
	linkDestination?: string;
	onChangeUrl: ( change: ImageURLInputUIChange ) => void;
	url?: string;
	mediaType?: string;
	mediaUrl?: string;
	mediaLink?: string;
	linkTarget?: string;
	linkClass?: string;
	rel?: string;
	showLightboxSetting?: boolean;
	lightboxEnabled?: boolean;
	onSetLightbox?: ( enabled: boolean ) => void;
	resetLightbox?: () => void;
}
