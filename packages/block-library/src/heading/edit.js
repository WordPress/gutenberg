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
import { PanelBody, RangeControl } from '@wordpress/components';
import { createBlock } from '@wordpress/blocks';
import {
	AlignmentToolbar,
	BlockControls,
	InspectorControls,
	RichText,
	__experimentalUseColors,
} from '@wordpress/block-editor';
import { useRef } from '@wordpress/element';

import {
	GlobalStylesControls,
	GlobalStylesPanelBody,
	useGlobalStylesState,
} from '@wordpress/global-styles';

function HeadingEdit( {
	attributes,
	setAttributes,
	mergeBlocks,
	onReplace,
	className,
} ) {
	const ref = useRef();
	const { headingFontWeight, setStyles } = useGlobalStylesState();
	const { TextColor, InspectorControlsColorPanel } = __experimentalUseColors(
		[ { name: 'textColor', property: 'color' } ],
		{
			contrastCheckers: { backgroundColor: true, textColor: true },
			colorDetector: { targetRef: ref },
		},
		[]
	);

	const { align, content, level, placeholder } = attributes;
	const tagName = 'h' + level;

	return (
		<>
			<BlockControls>
				<HeadingToolbar
					minLevel={ 2 }
					maxLevel={ 5 }
					selectedLevel={ level }
					onChange={ ( newLevel ) =>
						setAttributes( { level: newLevel } )
					}
				/>
				<AlignmentToolbar
					value={ align }
					onChange={ ( nextAlign ) => {
						setAttributes( { align: nextAlign } );
					} }
				/>
			</BlockControls>
			<GlobalStylesControls>
				<GlobalStylesPanelBody title={ __( 'Heading' ) }>
					<RangeControl
						label={ __( 'Font Weight' ) }
						value={ headingFontWeight }
						onChange={ ( nextValue ) =>
							setStyles( { headingFontWeight: nextValue } )
						}
						min={ 100 }
						max={ 900 }
						step={ 100 }
					/>
				</GlobalStylesPanelBody>
			</GlobalStylesControls>
			<InspectorControls>
				<PanelBody title={ __( 'Heading settings' ) }>
					<p>{ __( 'Level' ) }</p>
					<HeadingToolbar
						isCollapsed={ false }
						minLevel={ 1 }
						maxLevel={ 7 }
						selectedLevel={ level }
						onChange={ ( newLevel ) =>
							setAttributes( { level: newLevel } )
						}
					/>
				</PanelBody>
			</InspectorControls>
			{ InspectorControlsColorPanel }
			<TextColor>
				<RichText
					ref={ ref }
					identifier="content"
					tagName={ tagName }
					value={ content }
					onChange={ ( value ) =>
						setAttributes( { content: value } )
					}
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

export default HeadingEdit;
