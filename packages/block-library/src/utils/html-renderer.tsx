import clsx from 'clsx';
import parse, { attributesToProps, domToReact } from 'html-react-parser';
import type {
	DOMNode,
	Element,
	HTMLReactParserOptions,
} from 'html-react-parser';
import { safeHTML } from '@wordpress/dom';
import type { HtmlRendererProps } from './types';

/**
 * Renders HTML content as React elements with optional wrapper props.
 *
 * @param {Object} props              - The props for the component.
 * @param {Object} props.wrapperProps - The props to merge with the root element.
 *                                    className and style are merged with the parsed HTML attributes.
 * @param {string} props.html         - The HTML content to render.
 * @return {React.JSX.Element} The rendered React elements.
 */
const HtmlRenderer = ( {
	wrapperProps = {},
	html = '',
}: HtmlRendererProps ) => {
	const options: HTMLReactParserOptions = {
		replace: ( domNode ) => {
			if ( domNode.type === 'tag' && 'name' in domNode ) {
				const { name, attribs, parent, children } = domNode as Element;
				const parsedProps = attributesToProps( attribs || {} );
				const TagName = name as React.ElementType;
				if ( ! parent ) {
					const mergedProps = {
						...parsedProps,
						...wrapperProps,
						className: clsx(
							parsedProps.className,
							wrapperProps.className
						),
						style: {
							...( parsedProps.style || {} ),
							...( wrapperProps.style || {} ),
						},
					};
					return (
						<TagName { ...mergedProps }>
							{ domToReact( children as DOMNode[], options ) }
						</TagName>
					);
				}
			}
			return undefined;
		},
	};

	const sanitizedContent = safeHTML( html );
	const parsedContent = parse( sanitizedContent, options );

	return parsedContent;
};

export default HtmlRenderer;
