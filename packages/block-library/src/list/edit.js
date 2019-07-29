/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';
import { AlignmentToolbar, BlockControls, RichText } from '@wordpress/block-editor';

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
	const { ordered, textAlign, values } = attributes;

	return (
		<>
			<BlockControls>
				<AlignmentToolbar
					value={ textAlign }
					onChange={ ( nextAlign ) => {
						setAttributes( { textAlign: nextAlign } );
					} }
				/>
			</BlockControls>
			<RichText
				identifier="values"
				multiline="li"
				tagName={ ordered ? 'ol' : 'ul' }
				onChange={ ( nextValues ) => setAttributes( { values: nextValues } ) }
				value={ values }
				wrapperClassName="block-library-list"
				className={ classnames( className, {
					[ `has-text-align-${ textAlign }` ]: textAlign,
				} ) }
				placeholder={ __( 'Write list…' ) }
				onMerge={ mergeBlocks }
				onSplit={ ( value ) => createBlock( name, { ordered, values: value } ) }
				__unstableOnSplitMiddle={ () => createBlock( 'core/paragraph' ) }
				onReplace={ onReplace }
				onRemove={ () => onReplace( [] ) }
				onTagNameChange={ ( tag ) => setAttributes( { ordered: tag === 'ol' } ) }
			/>
		</>
	);
}
