/**
 * WordPress dependencies
 */
import { isURL } from '@wordpress/url';

/**
 * Returns URLs when a paragraph only contains link (and line break) nodes that
 * each look like a standalone HTTPS URL.
 *
 * @param paragraph Paragraph element to inspect.
 */
function getLinkOnlyParagraphUrls( paragraph: Element ): string[] | null {
	if ( paragraph.nodeName !== 'P' ) {
		return null;
	}

	const urls: string[] = [];

	for ( const child of Array.from( paragraph.childNodes ) ) {
		if ( child.nodeType === Node.TEXT_NODE ) {
			if ( child.textContent?.trim() ) {
				return null;
			}
			continue;
		}

		if ( child.nodeType !== Node.ELEMENT_NODE ) {
			return null;
		}

		const element = child as Element;

		if ( element.nodeName === 'BR' ) {
			continue;
		}

		if ( element.nodeName !== 'A' ) {
			return null;
		}

		const href = element.getAttribute( 'href' )?.trim() ?? '';
		const text = element.textContent?.trim() ?? '';

		if (
			href !== text ||
			! isURL( href ) ||
			! /^https:\/\//i.test( href ) ||
			href.match( /https:\/\//gi )?.length !== 1
		) {
			return null;
		}

		urls.push( href );
	}

	if ( urls.length < 2 ) {
		return null;
	}

	return urls;
}

/**
 * Splits paragraphs that contain multiple standalone URL links (often separated
 * by `<br>` after Markdown conversion) into one paragraph per URL.
 *
 * @param HTML HTML to filter.
 */
export default function multilineUrlParagraphSplitter( HTML: string ): string {
	const doc = document.implementation.createHTMLDocument( '' );
	doc.body.innerHTML = HTML;

	const paragraphsToSplit: { paragraph: Element; urls: string[] }[] = [];

	for ( const node of Array.from( doc.body.children ) ) {
		const urls = getLinkOnlyParagraphUrls( node );
		if ( urls ) {
			paragraphsToSplit.push( { paragraph: node, urls } );
		}
	}

	if ( ! paragraphsToSplit.length ) {
		return HTML;
	}

	for ( const { paragraph, urls } of paragraphsToSplit ) {
		const fragment = doc.createDocumentFragment();

		for ( const url of urls ) {
			const newParagraph = doc.createElement( 'p' );
			const link = doc.createElement( 'a' );
			link.setAttribute( 'href', url );
			link.textContent = url;
			newParagraph.appendChild( link );
			fragment.appendChild( newParagraph );
		}

		paragraph.replaceWith( fragment );
	}

	return doc.body.innerHTML;
}
