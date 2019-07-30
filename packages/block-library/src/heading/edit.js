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
import { PanelBody } from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { createBlock } from '@wordpress/blocks';
import {
	AlignmentToolbar,
	BlockControls,
	InspectorControls,
	RichText,
	withColors,
	PanelColorSettings,
} from '@wordpress/block-editor';
import { memo } from '@wordpress/element';

const HeadingColorUI = memo(
	function( {
		textColorValue,
		setTextColor,
	} ) {
		return (
			<PanelColorSettings
				title={ __( 'Color Settings' ) }
				initialOpen={ false }
				colorSettings={ [
					{
						value: textColorValue,
						onChange: setTextColor,
						label: __( 'Text Color' ),
					},
				] }
			/>
		);
	}
);

function HeadingEdit( {
	attributes,
	setAttributes,
	mergeBlocks,
	onReplace,
	className,
	textColor,
	setTextColor,
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
						isCollapsed={ false }
						value={ align }
						onChange={ ( nextAlign ) => {
							setAttributes( { align: nextAlign } );
						} }
					/>
				</PanelBody>
				<HeadingColorUI
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
					'has-text-color': textColor.color,
					[ textColor.class ]: textColor.class,
				} ) }
				placeholder={ placeholder || __( 'Write heading…' ) }
				style={ {
					color: textColor.color,
				} }
			/>
		</>
	);
}

export default compose( [
	withColors( 'backgroundColor', { textColor: 'color' } ),
] )( HeadingEdit );
