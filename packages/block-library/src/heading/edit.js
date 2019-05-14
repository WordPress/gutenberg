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
import { compose } from '@wordpress/compose';
import { createBlock } from '@wordpress/blocks';
import {
	AlignmentToolbar,
	BlockControls,
	InspectorControls,
	RichText,
	withColors,
	PanelColorSettings,
	ContrastChecker,
} from '@wordpress/block-editor';
import { memo } from '@wordpress/element';

const { getComputedStyle } = window;
const applyFallbackStyles = withFallbackStyles( ( node, ownProps ) => {
	const { textColor, backgroundColor, fontSize, customFontSize } = ownProps.attributes;
	const editableNode = node.querySelector( '[contenteditable="true"]' );
	//verify if editableNode is available, before using getComputedStyle.
	const computedStyles = editableNode ? getComputedStyle( editableNode ) : null;
	return {
		fallbackBackgroundColor: backgroundColor || ! computedStyles ? undefined : computedStyles.backgroundColor,
		fallbackTextColor: textColor || ! computedStyles ? undefined : computedStyles.color,
		fallbackFontSize: fontSize || customFontSize || ! computedStyles ? undefined : parseInt( computedStyles.fontSize ) || undefined,
	};
} );

const HeadingColorUI = memo(
	function( {
		backgroundColorValue,
		setBackgroundColor,
		textColorValue,
		setTextColor,
		fallbackTextColor,
		fallbackBackgroundColor,
	} ) {
		return (
			<PanelColorSettings
				title={ __( 'Color Settings' ) }
				initialOpen={ false }
				colorSettings={ [
					{
						value: backgroundColorValue,
						onChange: setBackgroundColor,
						label: __( 'Background Color' ),
					},
					{
						value: textColorValue,
						onChange: setTextColor,
						label: __( 'Text Color' ),
					},
				] }
			>
				<ContrastChecker
					{ ...{
						textColor: textColorValue,
						backgroundColor: backgroundColorValue,
						fallbackTextColor,
						fallbackBackgroundColor,
					} }
					isLargeText
				/>
			</PanelColorSettings>
		);
	}
);

function HeadingEdit( {
	attributes,
	setAttributes,
	mergeBlocks,
	insertBlocksAfter,
	onReplace,
	className,
	backgroundColor,
	textColor,
	setBackgroundColor,
	setTextColor,
	fallbackBackgroundColor,
	fallbackTextColor,
} ) {
	const { align, content, level, placeholder } = attributes;
	const tagName = 'h' + level;

	return (
		<>
			<BlockControls>
				<HeadingToolbar minLevel={ 2 } maxLevel={ 5 } selectedLevel={ level } onChange={ ( newLevel ) => setAttributes( { level: newLevel } ) } />
			</BlockControls>
			<InspectorControls>
				<PanelBody title={ __( 'Heading Settings' ) }>
					<p>{ __( 'Level' ) }</p>
					<HeadingToolbar minLevel={ 1 } maxLevel={ 7 } selectedLevel={ level } onChange={ ( newLevel ) => setAttributes( { level: newLevel } ) } />
					<p>{ __( 'Text Alignment' ) }</p>
					<AlignmentToolbar
						value={ align }
						onChange={ ( nextAlign ) => {
							setAttributes( { align: nextAlign } );
						} }
					/>
				</PanelBody>
				<HeadingColorUI
					backgroundColorValue={ backgroundColor.color }
					fallbackBackgroundColor={ fallbackBackgroundColor }
					fallbackTextColor={ fallbackTextColor }
					setBackgroundColor={ setBackgroundColor }
					setTextColor={ setTextColor }
					textColorValue={ textColor.color }
				/>
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
				className={ classnames( className, {
					'has-background': backgroundColor.color,
					'has-text-color': textColor.color,
					[ backgroundColor.class ]: backgroundColor.class,
					[ textColor.class ]: textColor.class,
				} ) }
				placeholder={ placeholder || __( 'Write heading…' ) }
				style={ {
					backgroundColor: backgroundColor.color,
					color: textColor.color,
					textAlign: align,
				} }
			/>
		</>
	);
}

export default compose( [
	withColors( 'backgroundColor', { textColor: 'color' } ),
	applyFallbackStyles,
] )( HeadingEdit );
