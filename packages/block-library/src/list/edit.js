/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';
import { RichText } from '@wordpress/block-editor';

export default function ListEdit( {
	attributes,
	insertBlocksAfter,
	setAttributes,
	mergeBlocks,
	onReplace,
	className,
} ) {
	const { ordered, values } = attributes;

	return (
		<RichText
			identifier="values"
			multiline="li"
			tagName={ ordered ? 'ol' : 'ul' }
			onChange={ ( nextValues ) => setAttributes( { values: nextValues } ) }
			value={ values }
			wrapperClassName="block-library-list"
			className={ className }
			placeholder={ __( 'Write list…' ) }
			onMerge={ mergeBlocks }
			unstableOnSplit={
				insertBlocksAfter ?
					( before, after, ...blocks ) => {
						if ( ! blocks.length ) {
							blocks.push( createBlock( 'core/paragraph' ) );
						}

						if ( after !== '<li></li>' ) {
							blocks.push( createBlock( 'core/list', {
								ordered,
								values: after,
							} ) );
						}

						setAttributes( { values: before } );
						insertBlocksAfter( blocks );
					} :
					undefined
			}
			onRemove={ () => onReplace( [] ) }
			onTagNameChange={ ( tag ) => setAttributes( { ordered: tag === 'ol' } ) }
		/>
	);
}
