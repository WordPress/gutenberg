import clsx from 'clsx';
import type { CSSProperties, ElementType, ReactNode } from 'react';
import parse, {
	attributesToProps,
	domToReact,
	Element,
	type DOMNode,
	type HTMLReactParserOptions,
} from 'html-react-parser';
import { safeHTML } from '@wordpress/dom';

interface HtmlRendererProps {
	/**
	 * Props to merge with each top-level element. `className` and `style`
	 * are merged with the parsed HTML attributes.
	 */
	wrapperProps?: Record< string, unknown > & {
		className?: string;
		style?: CSSProperties;
	};
	/** The HTML content to render. */
	html?: string;
}

/**
 * Renders HTML content as React elements with optional wrapper props.
 *
 * @param props              The props for the component.
 * @param props.wrapperProps The props to merge with the root element.
 *                           className and style are merged with the parsed HTML attributes.
 * @param props.html         The HTML content to render.
 * @return The rendered React elements.
 */
const HtmlRenderer = ( {
	wrapperProps = {},
	html = '',
}: HtmlRendererProps ): ReactNode => {
	const options: HTMLReactParserOptions = {
		replace: ( domNode ) => {
			if (
				! ( domNode instanceof Element ) ||
				domNode.type !== 'tag' ||
				domNode.parent
			) {
				return;
			}
			const parsedProps = attributesToProps( domNode.attribs || {} );
			const TagName = domNode.name as ElementType;
			const mergedProps = {
				...parsedProps,
				...wrapperProps,
				className: clsx(
					parsedProps.className,
					wrapperProps.className
				),
				style: {
					...( ( parsedProps.style as CSSProperties ) || {} ),
					...( wrapperProps.style || {} ),
				},
			};
			return (
				<TagName { ...mergedProps }>
					{ domToReact( domNode.children as DOMNode[], options ) }
				</TagName>
			);
		},
	};

	const sanitizedContent = safeHTML( html );
	const parsedContent = parse( sanitizedContent, options );

	return parsedContent;
};

export default HtmlRenderer;
