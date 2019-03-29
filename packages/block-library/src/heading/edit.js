/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * Internal dependencies
 */
import HeadingToolbar from './heading-toolbar';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';
import { PanelBody } from '@wordpress/components';
import { createBlock } from '@wordpress/blocks';
import { withSelect } from '@wordpress/data';
import {
	RichText,
	BlockControls,
	InspectorControls,
	AlignmentToolbar,
} from '@wordpress/block-editor';

function HeadingEdit( {
	attributes,
	setAttributes,
	mergeBlocks,
	insertBlocksAfter,
	onReplace,
	className,
	levelChoices,
} ) {
	const { align, content, level, placeholder } = attributes;
	const tagName = 'h' + level;
	const BlockControlsLevelsRange = ( levelChoices.length <= 3 ) ?
		levelChoices :
		levelChoices.slice( 1, 4 ); //
	return (
		<Fragment>
			<BlockControls>
				<HeadingToolbar levelsRange={ BlockControlsLevelsRange } selectedLevel={ level } onChange={ ( newLevel ) => setAttributes( { level: newLevel } ) } />
			</BlockControls>
			<InspectorControls>
				<PanelBody title={ __( 'Heading Settings' ) }>
					<p>{ __( 'Level' ) }</p>
					<HeadingToolbar levelsRange={ levelChoices } selectedLevel={ level } onChange={ ( newLevel ) => setAttributes( { level: newLevel } ) } />
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
				identifier="content"
				wrapperClassName="wp-block-heading"
				tagName={ tagName }
				value={ content }
				onChange={ ( value ) => setAttributes( { content: value } ) }
				onMerge={ mergeBlocks }
				unstableOnSplit={
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

export default withSelect( ( select ) => {
	// Parse the h1,h2,h3... choices to level numbers and pass it as a prop.
	const levelChoices = get(
		select( 'core/blocks' ).getBlockType( 'core/heading' ),
		[ 'attributes', 'level', 'enum' ],
		[]
	);

	return {
		levelChoices,
	};
} )( HeadingEdit );

