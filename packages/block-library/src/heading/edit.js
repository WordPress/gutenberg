/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import HeadingToolbar from './heading-toolbar';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody, withFallbackStyles } from '@wordpress/components';
import { createBlock } from '@wordpress/blocks';
import {
	AlignmentToolbar,
	BlockControls,
	InspectorControls,
	RichText,
	__experimentalUseColors,
} from '@wordpress/block-editor';

/**
 * Browser dependencies
 */
const { getComputedStyle } = window;

function HeadingEdit( {
	backgroundColor,
	attributes,
	setAttributes,
	mergeBlocks,
	onReplace,
	className,
} ) {
	const { TextColor, InspectorControlsColorPanel } = __experimentalUseColors(
		[ { name: 'textColor', property: 'color' } ],
		{
			contrastCheckerProps: { backgroundColor, isLargeText: true },
		},
		[]
	);

	const { align, content, level, placeholder } = attributes;
	const tagName = 'h' + level;

	return (
		<>
			<BlockControls>
				<HeadingToolbar minLevel={ 2 } maxLevel={ 5 } selectedLevel={ level } onChange={ ( newLevel ) => setAttributes( { level: newLevel } ) } />
				<AlignmentToolbar value={ align } onChange={ ( nextAlign ) => {
					setAttributes( { align: nextAlign } );
				} } />
			</BlockControls>
			<InspectorControls>
				<PanelBody title={ __( 'Heading Settings' ) }>
					<p>{ __( 'Level' ) }</p>
					<HeadingToolbar isCollapsed={ false } minLevel={ 1 } maxLevel={ 7 } selectedLevel={ level } onChange={ ( newLevel ) => setAttributes( { level: newLevel } ) } />
				</PanelBody>
			</InspectorControls>
			{ InspectorControlsColorPanel }
			<TextColor>
				<RichText
					identifier="content"
					tagName={ tagName }
					value={ content }
					onChange={ ( value ) => setAttributes( { content: value } ) }
					onMerge={ mergeBlocks }
					onSplit={ ( value ) => {
						if ( ! value ) {
							return createBlock( 'core/paragraph' );
						}

						return createBlock( 'core/heading', {
							...attributes,
							content: value,
						} );
					} }
					onReplace={ onReplace }
					onRemove={ () => onReplace( [] ) }
					className={ classnames( className, {
						[ `has-text-align-${ align }` ]: align,
					} ) }
					placeholder={ placeholder || __( 'Write heading…' ) }
				/>
			</TextColor>
		</>
	);
}

export default withFallbackStyles( ( node ) => {
	let backgroundColor = getComputedStyle( node ).backgroundColor;
	while ( backgroundColor === 'rgba(0, 0, 0, 0)' && node.parentNode ) {
		node = node.parentNode;
		backgroundColor = getComputedStyle( node ).backgroundColor;
	}
	return { backgroundColor };
} )( HeadingEdit );
