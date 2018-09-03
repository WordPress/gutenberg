/**
 * Internal dependencies
 */
import createLevelControl from './level-control';

/**
 * External dependencies
 */
import { range } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';
import { PanelBody, Toolbar } from '@wordpress/components';
import { createBlock } from '@wordpress/blocks';
import { RichText, BlockControls, InspectorControls, AlignmentToolbar } from '@wordpress/editor';

export default function HeadingEdit( {
	attributes,
	setAttributes,
	mergeBlocks,
	insertBlocksAfter,
	onReplace,
	className,
} ) {
	const { align, content, level, placeholder } = attributes;
	const tagName = 'h' + level;

	return (
		<Fragment>
			<BlockControls>
				<Toolbar controls={ range( 2, 5 ).map( ( index ) => createLevelControl( index, level, setAttributes ) ) } />
			</BlockControls>
			<InspectorControls>
				<PanelBody title={ __( 'Heading Settings' ) }>
					<p>{ __( 'Level' ) }</p>
					<Toolbar controls={ range( 1, 7 ).map( ( index ) => createLevelControl( index, level, setAttributes ) ) } />
					<p>{ __( 'Text Alignment' ) }</p>
					<AlignmentToolbar
						value={ align }
						onChange={ ( nextAlign ) => {
							setAttributes( { align: nextAlign } );
						} }
					/>
				</PanelBody>
			</InspectorControls>
			<RichText
				wrapperClassName="wp-block-heading"
				tagName={ tagName }
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
