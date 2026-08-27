export type SandBoxProps = {
	/**
	 * Whether to include `allow-same-origin` in the iframe's sandbox
	 * attribute. When true, nested iframes (such as third-party embeds)
	 * can access their own origin's cookies and storage.
	 *
	 * Only enable this for content that is NOT directly user-controlled,
	 * such as server-fetched oEmbed previews.
	 *
	 * @default false
	 */
	allowSameOrigin?: boolean;
	/**
	 * Whether to include `allow-popups` in the iframe's sandbox attribute.
	 * When true, content inside the iframe is allowed to open new browsing
	 * contexts (e.g. links that open in a new tab, or `window.open`).
	 *
	 * Enable this for previews whose content includes links that should be
	 * followable, such as embeds.
	 *
	 * @default false
	 */
	allowPopups?: boolean;
	/**
	 * Whether to include `allow-forms` in the iframe's sandbox attribute.
	 * When true, content inside the iframe is allowed to submit forms.
	 *
	 * Enable this for previews whose content includes forms that should be
	 * submittable.
	 *
	 * @default false
	 */
	allowForms?: boolean;
	/**
	 * The HTML to render in the body of the iframe document.
	 *
	 * @default ''
	 */
	html?: string;
	/**
	 * The `<title>` of the iframe document.
	 *
	 * @default ''
	 */
	title?: string;
	/**
	 * The CSS class name to apply to the `<html>` and `<body>` elements of the iframe.
	 */
	type?: string;
	/**
	 * An array of CSS strings to inject into the `<head>` of the iframe document.
	 *
	 * @default []
	 */
	styles?: string[];
	/**
	 * An array of script URLs to inject as `<script>` tags into the bottom of the `<body>` of the iframe document.
	 *
	 * @default []
	 */
	scripts?: string[];
	/**
	 * The `onFocus` callback for the iframe.
	 */
	onFocus?: React.DOMAttributes< HTMLIFrameElement >[ 'onFocus' ];
	/**
	 * The `tabindex` the iframe should receive.
	 *
	 * @default 0
	 */
	tabIndex?: HTMLElement[ 'tabIndex' ];
	/**
	 * Called when a link inside the sandboxed content is clicked.
	 *
	 * Passing this handler also stops such a click from navigating the sandbox
	 * away. The iframe has no `allow-top-navigation`, so a link can only
	 * replace the sandboxed content itself with the linked page, which is
	 * rarely what a preview wants. Use this to offer the link to the user
	 * instead, for example in a popover anchored to it.
	 */
	onLinkClick?: ( link: SandBoxLink ) => void;
};

export type SandBoxLink = {
	/**
	 * The URL of the clicked link.
	 */
	href: string;
	/**
	 * Virtual element tracking the clicked link's position, in the coordinate
	 * space of the document containing the sandbox. Suitable as a `Popover`
	 * `anchor`.
	 */
	anchor: {
		getBoundingClientRect: () => DOMRect;
		contextElement: HTMLIFrameElement;
	};
};
