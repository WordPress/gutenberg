/**
 * External dependencies
 */
import parse, { attributesToProps, domToReact } from 'html-react-parser';

/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';
import { safeHTML } from '@wordpress/dom';
import { useDisabled } from '@wordpress/compose';

/**
 * Generates an Edit component that works in the block editor
 * from the given HTML content.
 *
 * @param {Object} props      - The props for the component.
 * @param {string} props.html - The HTML content to render.
 * @return {JSX.Element} The Edit component.
 */
const BlockFromHtml = ( { html = '' } ) => {
	const disabledRef = useDisabled();
	const blockProps = useBlockProps( { ref: disabledRef } );

	const options = {
		replace: ( { name, type, attribs, parent, children } ) => {
			if ( type === 'tag' && name ) {
				const parsedProps = attributesToProps( attribs || {} );
				const TagName = name;
				if ( ! parent ) {
					const mergedProps = {
						...parsedProps,
						...blockProps,
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
