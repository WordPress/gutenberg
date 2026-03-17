/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Messages providing helpful descriptions for HTML elements.
 */
export const htmlElementMessages = {
	a: __(
		'The <a> element should be used for links that navigate to a different page or to a different section within the same page.'
	),
	article: __(
		'The <article> element should represent a self-contained, syndicatable portion of the document.'
	),
	aside: __(
		"The <aside> element should represent a portion of a document whose content is only indirectly related to the document's main content."
	),
	button: __(
		'The <button> element should be used for interactive controls that perform an action on the current page, such as opening a modal or toggling content visibility.'
	),
	div: __(
		'The <div> element should only be used if the block is a design element with no semantic meaning.'
	),
	footer: __(
		'The <footer> element should represent a footer for its nearest sectioning element (e.g.: <section>, <article>, <main> etc.).'
	),
	header: __(
		'The <header> element should represent introductory content, typically a group of introductory or navigational aids.'
	),
	main: __(
		'The <main> element should be used for the primary content of your document only.'
	),
	nav: __(
		'The <nav> element should be used to identify groups of links that are intended to be used for website or page content navigation.'
	),
	section: __(
		"The <section> element should represent a standalone portion of the document that can't be better represented by another element."
	),
};
