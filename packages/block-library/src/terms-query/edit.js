/**
 * WordPress dependencies
 */
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import TermsQueryInspectorControls from './inspector-controls';

const TEMPLATE = [ [ 'core/term-template' ] ];

export default function TermsQueryEdit( {
	attributes,
	setAttributes,
	clientId,
	name,
} ) {
	const { termQuery = {}, tagName: TagName = 'div' } = attributes;
	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		template: TEMPLATE,
	} );

	const setQuery = ( newQuery ) => {
		setAttributes( {
			termQuery: {
				...termQuery,
				...newQuery,
			},
		} );
	};
	return (
		<>
			<TermsQueryInspectorControls
				name={ name }
				attributes={ attributes }
				setQuery={ setQuery }
				setAttributes={ setAttributes }
				clientId={ clientId }
				tagName={ TagName }
			/>
			<TagName { ...innerBlocksProps } />
		</>
	);
}
