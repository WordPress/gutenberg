/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';
import { RichText } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { name } from './';

export default function ListEdit( {
	attributes,
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
			onSplit={ ( value ) => createBlock( name, { ordered, values: value } ) }
			__unstableOnSplitMiddle={ () => createBlock( 'core/paragraph' ) }
			onReplace={ onReplace }
			onRemove={ () => onReplace( [] ) }
			onTagNameChange={ ( tag ) => setAttributes( { ordered: tag === 'ol' } ) }
		/>
	);
}
