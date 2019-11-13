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
	withFallbackStyles,
} from '@wordpress/components';
import {
	withColors,
	AlignmentToolbar,
	BlockControls,
	ContrastChecker,
	FontSizePicker,
	InspectorControls,
	PanelColorSettings,
	RichText,
	withFontSizes,
} from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { compose } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';

const { getComputedStyle } = window;

const name = 'core/paragraph';

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

function ParagraphRTLToolbar( { direction, setDirection } ) {
	const isRTL = useSelect( ( select ) => {
		return select( 'core/block-editor' ).getSettings().isRTL;
	} );

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

function ParagraphPanelColor( {
	backgroundColor,
	fallbackBackgroundColor,
	fallbackTextColor,
	fontSize,
	setBackgroundColor,
	setTextColor,
	textColor,
} ) {
	return (
		<PanelColorSettings
			title={ __( 'Color Settings' ) }
			initialOpen={ false }
			colorSettings={ [
				{
					value: backgroundColor,
					onChange: setBackgroundColor,
					label: __( 'Background Color' ),
				},
				{
					value: textColor,
					onChange: setTextColor,
					label: __( 'Text Color' ),
				},
			] }
		>
			<ContrastChecker
				{ ...{
					textColor,
					backgroundColor,
					fallbackTextColor,
					fallbackBackgroundColor,
					fontSize,
				} }
			/>
		</PanelColorSettings>
	);
}

function ParagraphBlock( {
	attributes,
	backgroundColor,
	className,
	fallbackBackgroundColor,
	fallbackFontSize,
	fallbackTextColor,
	fontSize,
	mergeBlocks,
	onReplace,
	setAttributes,
	setBackgroundColor,
	setFontSize,
	setTextColor,
	textColor,
} ) {
	const {
		align,
		content,
		dropCap,
		placeholder,
		direction,
	} = attributes;

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
				<PanelBody title={ __( 'Text Settings' ) } className="blocks-font-size">
					<FontSizePicker
						fallbackFontSize={ fallbackFontSize }
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
				<ParagraphPanelColor
					backgroundColor={ backgroundColor.color }
					fallbackBackgroundColor={ fallbackBackgroundColor }
					fallbackTextColor={ fallbackTextColor }
					fontSize={ fontSize.size }
					setBackgroundColor={ setBackgroundColor }
					setTextColor={ setTextColor }
					textColor={ textColor.color }
				/>
			</InspectorControls>
			<RichText
				identifier="content"
				tagName="p"
				className={ classnames( 'wp-block-paragraph', className, {
					'has-text-color': textColor.color,
					'has-background': backgroundColor.color,
					'has-drop-cap': dropCap,
					[ `has-text-align-${ align }` ]: align,
					[ backgroundColor.class ]: backgroundColor.class,
					[ textColor.class ]: textColor.class,
					[ fontSize.class ]: fontSize.class,
				} ) }
				style={ {
					backgroundColor: backgroundColor.color,
					color: textColor.color,
					fontSize: fontSize.size ? fontSize.size + 'px' : undefined,
					direction,
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
		</>
	);
}

const ParagraphEdit = compose( [
	withColors( 'backgroundColor', { textColor: 'color' } ),
	withFontSizes( 'fontSize' ),
	applyFallbackStyles,
] )( ParagraphBlock );

export default ParagraphEdit;
