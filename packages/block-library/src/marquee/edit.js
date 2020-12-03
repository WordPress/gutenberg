/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import {
	BlockControls,
	InspectorControls,
	RichText,
	useBlockProps,
	__experimentalUseEditorFeature as useEditorFeature,
} from '@wordpress/block-editor';
import { useRef } from '@wordpress/element';

function MarqueeBlock( { attributes, isSelected, setAttributes } ) {
	const { content } = attributes;
	const ref = useRef();
	const blockProps = useBlockProps( {
		ref,
	} );

	return (
		<>
			<BlockControls>sfasdfasfd</BlockControls>
			<InspectorControls>sadfas</InspectorControls>
			<RichText
				identifier="content"
				tagName={ isSelected ? 'p' : 'marquee' }
				{ ...blockProps }
				value={ content }
				onChange={ ( newContent ) =>
					setAttributes( { content: newContent } )
				}
				aria-label={
					content
						? __( 'Marquee block' )
						: __(
								'Empty block; start writing or type forward slash to choose a block'
						  )
				}
				placeholder={ __( 'Start writing' ) }
			/>
		</>
	);
}

export default MarqueeBlock;
