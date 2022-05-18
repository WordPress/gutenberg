/**
 * WordPress dependencies
 */
import { SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const htmlElementMessages = {
	header: __(
		'The <header> element should represent introductory content, typically a group of introductory or navigational aids.'
	),
	main: __(
		'The <main> element should be used for the primary content of your document only. '
	),
	section: __(
		"The <section> element should represent a standalone portion of the document that can't be better represented by another element."
	),
	article: __(
		'The <article> element should represent a self contained, syndicatable portion of the document.'
	),
	aside: __(
		"The <aside> element should represent a portion of a document whose content is only indirectly related to the document's main content."
	),
	footer: __(
		'The <footer> element should represent a footer for its nearest sectioning element (e.g.: <section>, <article>, <main> etc.).'
	),
	nav: __(
		'The <nav> element should represent a navigation element (e.g. a list of links).'
	),
};

const DEFAULT_OPTIONS = [
	{ label: '<div>', value: 'div' },
	{ label: '<header>', value: 'header' },
	{ label: '<main>', value: 'main' },
	{ label: '<section>', value: 'section' },
	{ label: '<article>', value: 'article' },
	{ label: '<aside>', value: 'aside' },
	{ label: '<footer>', value: 'footer' },
	{ label: '<nav>', value: 'nav' },
];

/**
 * Control for selecting the block tagname.
 *
 * @param {Object}   props                Component props.
 * @param {Function} props.onChange       Callback to handle onChange.
 * @param {Object}   props.tagNameOptions Tagnames to be used in the select control.
 * @param {string}   props.selectedValue  Selected tag value.
 *
 * @return {WPElement}                    Control for selecting the block tagname.
 */

export default function HtmlElementControl( {
	onChange,
	tagNameOptions = DEFAULT_OPTIONS,
	selectedValue,
} ) {
	return (
		<SelectControl
			label={ __( 'HTML element' ) }
			options={ tagNameOptions }
			value={ selectedValue }
			onChange={ onChange }
			help={ htmlElementMessages[ selectedValue ] }
		/>
	);
}
