/**
 * WordPress dependencies
 */
import { createElement, Fragment, useMemo } from '@wordpress/element';

/* The only inline tags a help note may carry; other markup renders as text. */
const ALLOWED_TAGS = new Set( [ 'em', 'strong' ] );

/**
 * Maps a parsed DOM node to a React node, unwrapping disallowed tags.
 *
 * @param node Parsed node.
 * @param key  React key for the produced element.
 */
function toReactNode( node: ChildNode, key: number ): React.ReactNode {
	if ( node.nodeType === Node.TEXT_NODE ) {
		return node.textContent;
	}

	if ( node.nodeType !== Node.ELEMENT_NODE ) {
		return null;
	}

	const children = Array.from( node.childNodes ).map( toReactNode );
	const tag = node.nodeName.toLowerCase();

	if ( ! ALLOWED_TAGS.has( tag ) ) {
		return createElement( Fragment, { key }, children );
	}

	return createElement( tag, { key }, children );
}

export interface HelpTextProps {
	/**
	 * Help note text.
	 */
	text: string;
}

/**
 * Renders a help note's text without injecting raw HTML: the text is
 * parsed and only `em`/`strong` come back as elements.
 *
 * @param {HelpTextProps} props Component props.
 */
export function HelpText( { text }: HelpTextProps ): React.ReactNode {
	return useMemo( () => {
		if ( ! /[<&]/.test( text ) ) {
			return text;
		}

		const doc = new window.DOMParser().parseFromString( text, 'text/html' );

		return Array.from( doc.body.childNodes ).map( toReactNode );
	}, [ text ] );
}
