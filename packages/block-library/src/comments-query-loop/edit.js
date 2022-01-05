/**
 * WordPress dependencies
 */
import {
	BlockControls,
	InspectorControls,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import { SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import QueryToolbar from './toolbar';

const TEMPLATE = [
	[ 'core/comment-template' ],
	[ 'core/comments-pagination' ],
];

export default function CommentsQueryLoopEdit( { attributes, setAttributes } ) {
	const { perPage, tagName: TagName } = attributes;

	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		template: TEMPLATE,
	} );

	return (
		<>
			<BlockControls>
				<QueryToolbar perPage={ perPage } setQuery={ setAttributes } />
			</BlockControls>
			<InspectorControls __experimentalGroup="advanced">
				<SelectControl
					label={ __( 'HTML element' ) }
					options={ [
						{ label: __( 'Default (<div>)' ), value: 'div' },
						{ label: '<section>', value: 'section' },
						{ label: '<aside>', value: 'aside' },
					] }
					value={ TagName }
					onChange={ ( value ) =>
						setAttributes( { tagName: value } )
					}
				/>
			</InspectorControls>
			<TagName { ...innerBlocksProps } />
		</>
	);
}
