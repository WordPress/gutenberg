/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import {
	PanelBody,
	ToggleControl,
	ToolbarGroup,
} from '@wordpress/components';
import {
	AlignmentToolbar,
	BlockControls,
	FontSizePicker,
	InspectorControls,
	RichText,
	withFontSizes,
	__experimentalUseColors,
} from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { compose } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { useEffect, useState, useRef } from '@wordpress/element';

/**
 * Browser dependencies
 */
const { getComputedStyle } = window;
const querySelector = window.document.querySelector.bind( document );

const name = 'core/paragraph';
const PARAGRAPH_DROP_CAP_SELECTOR = 'p.has-drop-cap';

function ParagraphRTLToolbar( { direction, setDirection } ) {
	const isRTL = useSelect( ( select ) => {
		return !! select( 'core/block-editor' ).getSettings().isRTL;
	}, [] );

	return ( isRTL && (
		<ToolbarGroup
			controls={ [
				{
					icon: 'editor-ltr',
					title: _x( 'Left to right', 'editor button' ),
					isActive: direction === 'ltr',
					onClick() {
						setDirection( direction === 'ltr' ? undefined : 'ltr' );
					},
				},
			] }
		/>
	) );
}

function useDropCapMinimumHeight( isDropCap, deps ) {
	const [ minimumHeight, setMinimumHeight ] = useState();
	useEffect(
		() => {
			const element = querySelector( PARAGRAPH_DROP_CAP_SELECTOR );
			if ( isDropCap && element ) {
				setMinimumHeight(
					getComputedStyle(
						element,
						'first-letter'
					).height
				);
			} else if ( minimumHeight ) {
				setMinimumHeight( undefined );
			}
		},
		[ isDropCap, minimumHeight, setMinimumHeight, ...deps ]
	);
	return minimumHeight;
}

function ParagraphBlock( {
	attributes,
	className,
	fontSize,
	mergeBlocks,
	onReplace,
	setAttributes,
	setFontSize,
} ) {
	const {
		align,
		content,
		dropCap,
		placeholder,
		direction,
	} = attributes;

	const ref = useRef();
	const dropCapMinimumHeight = useDropCapMinimumHeight( dropCap, [ fontSize.size ] );
	const {
		TextColor,
		BackgroundColor,
		InspectorControlsColorPanel,
	} = __experimentalUseColors(
		[
			{ name: 'textColor', property: 'color' },
			{ name: 'backgroundColor', className: 'has-background' },
		],
		{
			contrastCheckers: [ { backgroundColor: true, textColor: true, fontSize: fontSize.size } ],
			colorDetector: { targetRef: ref },
		},
		[ fontSize.size ]
	);

	return (
		<>
			<BlockControls>
				<AlignmentToolbar
					value={ align }
					onChange={ ( newAlign ) => setAttributes( { align: newAlign } ) }
				/>
				<ParagraphRTLToolbar
					direction={ direction }
					setDirection={ ( newDirection ) => setAttributes( { direction: newDirection } ) }
				/>
			</BlockControls>
			<InspectorControls>
				<PanelBody title={ __( 'Text Settings' ) }>
					<FontSizePicker
						value={ fontSize.size }
						onChange={ setFontSize }
					/>
					<ToggleControl
						label={ __( 'Drop Cap' ) }
						checked={ !! dropCap }
						onChange={ () => setAttributes( { dropCap: ! dropCap } ) }
						help={ dropCap ?
							__( 'Showing large initial letter.' ) :
							__( 'Toggle to show a large initial letter.' )
						}
					/>
				</PanelBody>
			</InspectorControls>
			{ InspectorControlsColorPanel }
			<BackgroundColor>
				<TextColor>
					<RichText
						ref={ ref }
						identifier="content"
						tagName="p"
						className={ classnames( 'wp-block-paragraph', className, {
							'has-drop-cap': dropCap,
							[ `has-text-align-${ align }` ]: align,
							[ fontSize.class ]: fontSize.class,
						} ) }
						style={ {
							fontSize: fontSize.size ? fontSize.size + 'px' : undefined,
							direction,
							minHeight: dropCapMinimumHeight,
						} }
						value={ content }
						onChange={ ( newContent ) => setAttributes( { content: newContent } ) }
						onSplit={ ( value ) => {
							if ( ! value ) {
								return createBlock( name );
							}

							return createBlock( name, {
								...attributes,
								content: value,
							} );
						} }
						onMerge={ mergeBlocks }
						onReplace={ onReplace }
						onRemove={ onReplace ? () => onReplace( [] ) : undefined }
						aria-label={ content ? __( 'Paragraph block' ) : __( 'Empty block; start writing or type forward slash to choose a block' ) }
						placeholder={ placeholder || __( 'Start writing or type / to choose a block' ) }
						__unstableEmbedURLOnPaste
					/>
				</TextColor>
			</BackgroundColor>
		</>
	);
}

const ParagraphEdit = compose( [
	withFontSizes( 'fontSize' ),
] )( ParagraphBlock );

export default ParagraphEdit;
