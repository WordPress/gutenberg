/**
 * External dependencies
 */
import parse, { attributesToProps, domToReact } from 'html-react-parser';

/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';

/**
 * Generates an Edit component that works in the block editor
 * from the given HTML content.
 *
 * @param {Object} props         - The props for the component.
 * @param {string} props.content - The content to render.
 * @return {JSX.Element} The Edit component.
 */
const BlockFromHtml = ( { content = '' } ) => {
	const blockProps = useBlockProps();
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
	const parsedContent = parse( content, options );
	return parsedContent;
};

export default BlockFromHtml;
