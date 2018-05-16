/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';
import { createBlock } from '@wordpress/blocks';
import { RichText, BlockControls, AlignmentToolbar } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import './editor.scss';
import HeadingStylesToolbar from './styles-toolbar';

export default function HeadingEdit( {
	attributes,
	setAttributes,
	mergeBlocks,
	insertBlocksAfter,
	onReplace,
	className,
} ) {
	const { align, content, nodeName, placeholder } = attributes;

	return (
		<Fragment>
			<BlockControls>
				<HeadingStylesToolbar
					value={ nodeName }
					onChange={ ( nextNodeName ) => {
						setAttributes( { nodeName: nextNodeName } );
					} }
				/>
				<AlignmentToolbar
					value={ align }
					onChange={ ( nextAlign ) => {
						setAttributes( { align: nextAlign } );
					} }
				/>
			</BlockControls>
			<RichText
				wrapperClassName="wp-block-heading"
				tagName={ nodeName.toLowerCase() }
				value={ content }
				onChange={ ( value ) => setAttributes( { content: value } ) }
				onMerge={ mergeBlocks }
				onSplit={
					insertBlocksAfter ?
						( before, after, ...blocks ) => {
							setAttributes( { content: before } );
							insertBlocksAfter( [
								...blocks,
								createBlock( 'core/paragraph', { content: after } ),
							] );
						} :
						undefined
				}
				onRemove={ () => onReplace( [] ) }
				style={ { textAlign: align } }
				className={ className }
				placeholder={ placeholder || __( 'Write heading…' ) }
			/>
		</Fragment>
	);
}
