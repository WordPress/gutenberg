export type SandBoxProps = {
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
};
