/**
 * External dependencies
 */
import parse, { attributesToProps, domToReact } from 'html-react-parser';

/**
 * WordPress dependencies
 */
import { safeHTML } from '@wordpress/dom';

/**
 * Renders HTML content as React elements with optional wrapper props.
 *
 * @param {Object} props              - The props for the component.
 * @param {Object} props.wrapperProps - The props to merge with the root element.
 * @param {string} props.html         - The HTML content to render.
 * @return {JSX.Element} The rendered React elements.
 */
const HtmlRenderer = ( { wrapperProps = {}, html = '' } ) => {
	const options = {
		replace: ( { name, type, attribs, parent, children } ) => {
			if ( type === 'tag' && name ) {
				const parsedProps = attributesToProps( attribs || {} );
				const TagName = name;
				if ( ! parent ) {
					const mergedProps = {
						...parsedProps,
						...wrapperProps,
					};
					return (
						<TagName { ...mergedProps }>
							{ domToReact( children, options ) }
						</TagName>
					);
				}
			}
		},
	};

	const sanitizedContent = safeHTML( html );
	const parsedContent = parse( sanitizedContent, options );

	return parsedContent;
};

export default HtmlRenderer;
