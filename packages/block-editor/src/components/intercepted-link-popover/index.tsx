import type { ComponentProps } from 'react';
import { Popover } from '@wordpress/components';
import { Link } from '@wordpress/ui';
import { filterURLForDisplay, safeDecodeURI } from '@wordpress/url';

type InterceptedLinkPopoverProps = {
	/**
	 * The resolved URL that the click would have navigated to.
	 */
	href: string;
	/**
	 * The clicked link, or a virtual element standing in for one that lives in
	 * another document.
	 */
	anchor: ComponentProps< typeof Popover >[ 'anchor' ];
	/**
	 * Called when the popover should be dismissed.
	 */
	onClose: () => void;
};

/**
 * Popover shown when a link click in the editor has been intercepted to keep it
 * from navigating the editor, or a sandboxed preview, away. It surfaces the
 * link target so that the user can decide whether to follow it in a new tab.
 *
 * @param props
 * @param props.href    The resolved URL that the click would have navigated to.
 * @param props.anchor  The clicked link, or a virtual element standing in for
 *                      one that lives in another document.
 * @param props.onClose Called when the popover should be dismissed.
 */
export default function InterceptedLinkPopover( {
	href,
	anchor,
	onClose,
}: InterceptedLinkPopoverProps ) {
	return (
		<Popover
			className="block-editor-intercepted-link-popover"
			anchor={ anchor }
			placement="bottom"
			shift
			focusOnMount="firstElement"
			onClose={ onClose }
			onFocusOutside={ onClose }
		>
			<Link href={ href } openInNewTab>
				{ filterURLForDisplay( safeDecodeURI( href ) ) }
			</Link>
		</Popover>
	);
}
