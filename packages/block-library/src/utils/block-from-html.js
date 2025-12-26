/**
 * External dependencies
 */
import parse, { attributesToProps, domToReact } from 'html-react-parser';

/**
 * WordPress dependencies
 */
import { safeHTML } from '@wordpress/dom';

/**
 * Generates an Edit component that works in the block editor
 * from the given HTML content.
 *
 * @param {Object} props              - The props for the component.
 * @param {Object} props.wrapperProps - The props for the block wrapper.
 * @param {string} props.html         - The HTML content to render.
 * @return {JSX.Element} The Edit component.
 */
const BlockFromHtml = ( { wrapperProps = {}, html = '' } ) => {
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

export default BlockFromHtml;
