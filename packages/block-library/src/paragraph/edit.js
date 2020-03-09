/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { PanelBody, ToggleControl, ToolbarGroup } from '@wordpress/components';
import {
	AlignmentToolbar,
	BlockControls,
	FontSizePicker,
	InspectorControls,
	RichText,
	withFontSizes,
	__experimentalUseColors,
	__experimentalBlock as Block,
	__experimentalWithLineHeight as withLineHeight,
	__experimentalLineHeightControl as LineHeightControl,
} from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { compose } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { useEffect, useState, useRef } from '@wordpress/element';
import { formatLtr } from '@wordpress/icons';

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

	return (
		isRTL && (
			<ToolbarGroup
				controls={ [
					{
						icon: formatLtr,
						title: _x( 'Left to right', 'editor button' ),
						isActive: direction === 'ltr',
						onClick() {
							setDirection(
								direction === 'ltr' ? undefined : 'ltr'
							);
						},
					},
				] }
			/>
		)
	);
}

function useDropCapMinimumHeight( isDropCap, deps ) {
	const [ minimumHeight, setMinimumHeight ] = useState();
	useEffect( () => {
		const element = querySelector( PARAGRAPH_DROP_CAP_SELECTOR );
		if ( isDropCap && element ) {
			setMinimumHeight(
				getComputedStyle( element, 'first-letter' ).lineHeight
			);
		} else if ( minimumHeight ) {
			setMinimumHeight( undefined );
		}
	}, [ isDropCap, minimumHeight, setMinimumHeight, ...deps ] );
	return minimumHeight;
}

function ParagraphBlock( {
	attributes,
	fontSize,
	mergeBlocks,
	onReplace,
	setAttributes,
	setFontSize,
	className,
	style,
} ) {
	const { align, content, dropCap, placeholder, direction } = attributes;

	const ref = useRef();
	const dropCapMinimumHeight = useDropCapMinimumHeight( dropCap, [
		fontSize.size,
	] );
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
			contrastCheckers: [
				{
					backgroundColor: true,
					textColor: true,
					fontSize: fontSize.size,
				},
			],
			colorDetector: { targetRef: ref },
		},
		[ fontSize.size ]
	);

	const styles = {
		...style,
		fontSize: fontSize.size ? `${ fontSize.size }px` : undefined,
		direction,
		minHeight: dropCapMinimumHeight,
	};

	return (
		<>
			<BlockControls>
				<AlignmentToolbar
					value={ align }
					onChange={ ( newAlign ) =>
						setAttributes( { align: newAlign } )
					}
				/>
				<ParagraphRTLToolbar
					direction={ direction }
					setDirection={ ( newDirection ) =>
						setAttributes( { direction: newDirection } )
					}
				/>
			</BlockControls>
			<InspectorControls>
				<PanelBody title={ __( 'Text settings' ) }>
					<FontSizePicker
						value={ fontSize.size }
						onChange={ setFontSize }
					/>
					<LineHeightControl />
					<ToggleControl
						label={ __( 'Drop cap' ) }
						checked={ !! dropCap }
						onChange={ () =>
							setAttributes( { dropCap: ! dropCap } )
						}
						help={
							dropCap
								? __( 'Showing large initial letter.' )
								: __( 'Toggle to show a large initial letter.' )
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
						tagName={ Block.p }
						className={ className }
						style={ styles }
						value={ content }
						onChange={ ( newContent ) =>
							setAttributes( { content: newContent } )
						}
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
						onRemove={
							onReplace ? () => onReplace( [] ) : undefined
						}
						aria-label={
							content
								? __( 'Paragraph block' )
								: __(
										'Empty block; start writing or type forward slash to choose a block'
								  )
						}
						placeholder={
							placeholder ||
							__( 'Start writing or type / to choose a block' )
						}
						__unstableEmbedURLOnPaste
						__unstableAllowPrefixTransformations
					/>
				</TextColor>
			</BackgroundColor>
		</>
	);
}

const ParagraphEdit = compose( [
	withFontSizes( 'fontSize' ),
	withLineHeight(),
] )( ParagraphBlock );

export default ParagraphEdit;
