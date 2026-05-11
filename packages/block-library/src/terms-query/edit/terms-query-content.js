/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import TermsQueryInspectorControls from './inspector-controls';

const TEMPLATE = [ [ 'core/term-template' ] ];

export default function TermsQueryContent( {
	attributes,
	setAttributes,
	clientId,
	context,
} ) {
	const { tagName: TagName } = attributes;
	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		template: TEMPLATE,
	} );
	const setQuery = useCallback(
		( newQuery ) =>
			setAttributes( ( prevAttributes ) => ( {
				termQuery: { ...prevAttributes.termQuery, ...newQuery },
			} ) ),
		[ setAttributes ]
	);
	return (
		<>
			<TermsQueryInspectorControls
				attributes={ attributes }
				setQuery={ setQuery }
				setAttributes={ setAttributes }
				clientId={ clientId }
				templateSlug={ context?.templateSlug }
			/>
			<TagName { ...innerBlocksProps } />
		</>
	);
}
