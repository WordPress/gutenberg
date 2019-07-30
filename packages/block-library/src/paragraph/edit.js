/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import {
	PanelBody,
	ToggleControl,
	Toolbar,
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
import { withSelect } from '@wordpress/data';

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

class ParagraphBlock extends Component {
	constructor() {
		super( ...arguments );

		this.toggleDropCap = this.toggleDropCap.bind( this );
	}

	toggleDropCap() {
		const { attributes, setAttributes } = this.props;
		setAttributes( { dropCap: ! attributes.dropCap } );
	}

	getDropCapHelp( checked ) {
		return checked ? __( 'Showing large initial letter.' ) : __( 'Toggle to show a large initial letter.' );
	}

	render() {
		const {
			attributes,
			setAttributes,
			mergeBlocks,
			onReplace,
			className,
			backgroundColor,
			textColor,
			setBackgroundColor,
			setTextColor,
			fallbackBackgroundColor,
			fallbackTextColor,
			fallbackFontSize,
			fontSize,
			setFontSize,
			isRTL,
		} = this.props;

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
						onChange={ ( nextAlign ) => {
							setAttributes( { align: nextAlign } );
						} }
					/>
					{ isRTL && (
						<Toolbar
							controls={ [
								{
									icon: 'editor-ltr',
									title: _x( 'Left to right', 'editor button' ),
									isActive: direction === 'ltr',
									onClick() {
										const nextDirection = direction === 'ltr' ? undefined : 'ltr';
										setAttributes( {
											direction: nextDirection,
										} );
									},
								},
							] }
						/>
					) }
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
							onChange={ this.toggleDropCap }
							help={ this.getDropCapHelp }
						/>
					</PanelBody>
					<PanelColorSettings
						title={ __( 'Color Settings' ) }
						initialOpen={ false }
						colorSettings={ [
							{
								value: backgroundColor.color,
								onChange: setBackgroundColor,
								label: __( 'Background Color' ),
							},
							{
								value: textColor.color,
								onChange: setTextColor,
								label: __( 'Text Color' ),
							},
						] }
					>
						<ContrastChecker
							{ ...{
								textColor: textColor.color,
								backgroundColor: backgroundColor.color,
								fallbackTextColor,
								fallbackBackgroundColor,
							} }
							fontSize={ fontSize.size }
						/>
					</PanelColorSettings>
				</InspectorControls>
				<RichText
					identifier="content"
					tagName="p"
					className={ classnames( 'wp-block-paragraph', className, {
						'has-text-color': textColor.color,
						'has-background': backgroundColor.color,
						'has-drop-cap': dropCap,
						[ backgroundColor.class ]: backgroundColor.class,
						[ textColor.class ]: textColor.class,
						[ fontSize.class ]: fontSize.class,
					} ) }
					style={ {
						backgroundColor: backgroundColor.color,
						color: textColor.color,
						fontSize: fontSize.size ? fontSize.size + 'px' : undefined,
						textAlign: align,
						direction,
					} }
					value={ content }
					onChange={ ( nextContent ) => {
						setAttributes( {
							content: nextContent,
						} );
					} }
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
				/>
			</>
		);
	}
}

const ParagraphEdit = compose( [
	withColors( 'backgroundColor', { textColor: 'color' } ),
	withFontSizes( 'fontSize' ),
	applyFallbackStyles,
	withSelect( ( select ) => {
		const { getSettings } = select( 'core/block-editor' );

		return {
			isRTL: getSettings().isRTL,
		};
	} ),
] )( ParagraphBlock );

export default ParagraphEdit;
