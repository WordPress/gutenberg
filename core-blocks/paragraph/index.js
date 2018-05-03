/**
 * External dependencies
 */
import classnames from 'classnames';
import { findKey, isFinite, map, omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	concatChildren,
	Component,
	compose,
	Fragment,
	RawHTML,
} from '@wordpress/element';
import {
	PanelBody,
	PanelColor,
	RangeControl,
	ToggleControl,
	Button,
	ButtonGroup,
	withFallbackStyles,
} from '@wordpress/components';
import {
	createBlock,
	getColorClass,
	withColors,
	AlignmentToolbar,
	BlockControls,
	ColorPalette,
	ContrastChecker,
	InspectorControls,
	RichText,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import './editor.scss';
import './style.scss';

const { getComputedStyle } = window;

const FallbackStyles = withFallbackStyles( ( node, ownProps ) => {
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

const FONT_SIZES = {
	small: 14,
	regular: 16,
	large: 36,
	larger: 48,
};

class ParagraphBlock extends Component {
	constructor() {
		super( ...arguments );
		this.onReplace = this.onReplace.bind( this );
		this.toggleDropCap = this.toggleDropCap.bind( this );
		this.getFontSize = this.getFontSize.bind( this );
		this.setFontSize = this.setFontSize.bind( this );
	}

	onReplace( blocks ) {
		const { attributes, onReplace } = this.props;
		onReplace( blocks.map( ( block, index ) => (
			index === 0 && block.name === name ?
				{ ...block,
					attributes: {
						...attributes,
						...block.attributes,
					},
				} :
				block
		) ) );
	}

	toggleDropCap() {
		const { attributes, setAttributes } = this.props;
		setAttributes( { dropCap: ! attributes.dropCap } );
	}

	getDropCapHelp( checked ) {
		return checked ? __( 'Showing large initial letter.' ) : __( 'Toggle to show a large initial letter.' );
	}

	getFontSize() {
		const { customFontSize, fontSize } = this.props.attributes;
		if ( fontSize ) {
			return FONT_SIZES[ fontSize ];
		}

		if ( customFontSize ) {
			return customFontSize;
		}
	}

	setFontSize( fontSizeValue ) {
		const { setAttributes } = this.props;
		const thresholdFontSize = findKey( FONT_SIZES, ( size ) => size === fontSizeValue );
		if ( thresholdFontSize ) {
			setAttributes( {
				fontSize: thresholdFontSize,
				customFontSize: undefined,
			} );
			return;
		}
		setAttributes( {
			fontSize: undefined,
			customFontSize: fontSizeValue,
		} );
	}

	render() {
		const {
			attributes,
			setAttributes,
			insertBlocksAfter,
			mergeBlocks,
			onReplace,
			className,
			initializeColor,
			fallbackBackgroundColor,
			fallbackTextColor,
			fallbackFontSize,
		} = this.props;

		const {
			align,
			content,
			dropCap,
			placeholder,
		} = attributes;

		const fontSize = this.getFontSize();
		const textColor = initializeColor( {
			colorContext: 'color',
			colorAttribute: 'textColor',
			customColorAttribute: 'customTextColor',
		} );
		const backgroundColor = initializeColor( {
			colorContext: 'background-color',
			colorAttribute: 'backgroundColor',
			customColorAttribute: 'customBackgroundColor',
		} );

		return (
			<Fragment>
				<BlockControls>
					<AlignmentToolbar
						value={ align }
						onChange={ ( nextAlign ) => {
							setAttributes( { align: nextAlign } );
						} }
					/>
				</BlockControls>
				<InspectorControls>
					<PanelBody title={ __( 'Text Settings' ) } className="blocks-font-size">
						<div className="blocks-font-size__main">
							<ButtonGroup aria-label={ __( 'Font Size' ) }>
								{ map( {
									S: 'small',
									M: 'regular',
									L: 'large',
									XL: 'larger',
								}, ( size, label ) => (
									<Button
										key={ label }
										isLarge
										isPrimary={ fontSize === FONT_SIZES[ size ] }
										aria-pressed={ fontSize === FONT_SIZES[ size ] }
										onClick={ () => this.setFontSize( FONT_SIZES[ size ] ) }
									>
										{ label }
									</Button>
								) ) }
							</ButtonGroup>
							<Button
								isLarge
								onClick={ () => this.setFontSize( undefined ) }
							>
								{ __( 'Reset' ) }
							</Button>
						</div>
						<RangeControl
							className="blocks-paragraph__custom-size-slider"
							label={ __( 'Custom Size' ) }
							value={ fontSize || '' }
							initialPosition={ fallbackFontSize }
							onChange={ ( value ) => this.setFontSize( value ) }
							min={ 12 }
							max={ 100 }
							beforeIcon="editor-textcolor"
							afterIcon="editor-textcolor"
						/>
						<ToggleControl
							label={ __( 'Drop Cap' ) }
							checked={ !! dropCap }
							onChange={ this.toggleDropCap }
							help={ this.getDropCapHelp }
						/>
					</PanelBody>
					<PanelColor title={ __( 'Background Color' ) } colorValue={ backgroundColor.value } colorName={ backgroundColor.name } initialOpen={ false }>
						<ColorPalette
							value={ backgroundColor.value }
							onChange={ backgroundColor.set }
						/>
					</PanelColor>
					<PanelColor title={ __( 'Text Color' ) } colorValue={ textColor.value } colorName={ textColor.name } initialOpen={ false }>
						<ColorPalette
							value={ textColor.value }
							onChange={ textColor.set }
						/>
					</PanelColor>
					<ContrastChecker
						textColor={ textColor.value }
						backgroundColor={ backgroundColor.value }
						{ ...{
							fallbackBackgroundColor,
							fallbackTextColor,
						} }
						isLargeText={ fontSize >= 18 }
					/>
				</InspectorControls>
				<div>
					<RichText
						tagName="p"
						className={ classnames( 'wp-block-paragraph', className, {
							'has-background': backgroundColor.value,
							'has-drop-cap': dropCap,
							[ backgroundColor.class ]: backgroundColor.class,
							[ textColor.class ]: textColor.class,
						} ) }
						style={ {
							backgroundColor: backgroundColor.class ? undefined : backgroundColor.value,
							color: textColor.class ? undefined : textColor.value,
							fontSize: fontSize ? fontSize + 'px' : undefined,
							textAlign: align,
						} }
						value={ content }
						onChange={ ( nextContent ) => {
							setAttributes( {
								content: nextContent,
							} );
						} }
						onSplit={ insertBlocksAfter ?
							( before, after, ...blocks ) => {
								setAttributes( { content: before } );
								insertBlocksAfter( [
									...blocks,
									createBlock( 'core/paragraph', { content: after } ),
								] );
							} :
							undefined
						}
						onMerge={ mergeBlocks }
						onReplace={ this.onReplace }
						onRemove={ () => onReplace( [] ) }
						placeholder={ placeholder || __( 'Add text or type / to add content' ) }
					/>
				</div>
			</Fragment>
		);
	}
}

const supports = {
	className: false,
};

const deprecatedSchema = {
	width: {
		type: 'string',
	},
};

const schema = {
	...deprecatedSchema,
	content: {
		type: 'array',
		source: 'children',
		selector: 'p',
		default: [],
	},
	align: {
		type: 'string',
	},
	dropCap: {
		type: 'boolean',
		default: false,
	},
	placeholder: {
		type: 'string',
	},
	textColor: {
		type: 'string',
	},
	customTextColor: {
		type: 'string',
	},
	backgroundColor: {
		type: 'string',
	},
	customBackgroundColor: {
		type: 'string',
	},
	fontSize: {
		type: 'string',
	},
	customFontSize: {
		type: 'number',
	},
};

export const name = 'core/paragraph';

export const settings = {
	title: __( 'Paragraph' ),

	description: __( 'This is a simple text only block for adding a single paragraph of content.' ),

	icon: 'editor-paragraph',

	category: 'common',

	keywords: [ __( 'text' ) ],

	supports,

	attributes: schema,

	transforms: {
		from: [
			{
				type: 'raw',
				priority: 20,
				isMatch: ( node ) => (
					node.nodeName === 'P' &&
					// Do not allow embedded content.
					! node.querySelector( 'audio, canvas, embed, iframe, img, math, object, svg, video' )
				),
			},
		],
	},

	deprecated: [
		{
			supports,
			attributes: schema,
			save( { attributes } ) {
				const {
					width,
					align,
					content,
					dropCap,
					backgroundColor,
					textColor,
					customBackgroundColor,
					customTextColor,
					fontSize,
					customFontSize,
				} = attributes;

				const textClass = getColorClass( 'color', textColor );
				const backgroundClass = getColorClass( 'background-color', backgroundColor );
				const fontSizeClass = fontSize && FONT_SIZES[ fontSize ] && `is-${ fontSize }-text`;

				const className = classnames( {
					[ `align${ width }` ]: width,
					'has-background': backgroundColor || customBackgroundColor,
					'has-drop-cap': dropCap,
					[ fontSizeClass ]: fontSizeClass,
					[ textClass ]: textClass,
					[ backgroundClass ]: backgroundClass,
				} );

				const styles = {
					backgroundColor: backgroundClass ? undefined : customBackgroundColor,
					color: textClass ? undefined : customTextColor,
					fontSize: fontSizeClass ? undefined : customFontSize,
					textAlign: align,
				};

				return (
					<RichText.Content
						tagName="p"
						style={ styles }
						className={ className ? className : undefined }
						value={ content }
					/>
				);
			},
		},
		{
			supports,
			attributes: omit( {
				...schema,
				fontSize: {
					type: 'number',
				},
			}, 'customFontSize', 'customTextColor', 'customBackgroundColor' ),
			save( { attributes } ) {
				const { width, align, content, dropCap, backgroundColor, textColor, fontSize } = attributes;
				const className = classnames( {
					[ `align${ width }` ]: width,
					'has-background': backgroundColor,
					'has-drop-cap': dropCap,
				} );
				const styles = {
					backgroundColor: backgroundColor,
					color: textColor,
					fontSize: fontSize,
					textAlign: align,
				};

				return <p style={ styles } className={ className ? className : undefined }>{ content }</p>;
			},
			migrate( attributes ) {
				return omit( {
					...attributes,
					customFontSize: isFinite( attributes.fontSize ) ? attributes.fontSize : undefined,
					customTextColor: attributes.textColor && '#' === attributes.textColor[ 0 ] ? attributes.textColor : undefined,
					customBackgroundColor: attributes.backgroundColor && '#' === attributes.backgroundColor[ 0 ] ? attributes.backgroundColor : undefined,
				}, [ 'fontSize', 'textColor', 'backgroundColor' ] );
			},
		},
		{
			supports,
			attributes: {
				...schema,
				content: {
					type: 'string',
					source: 'html',
				},
			},
			save( { attributes } ) {
				return <RawHTML>{ attributes.content }</RawHTML>;
			},
			migrate( attributes ) {
				return {
					...attributes,
					content: [
						<RawHTML key="html">{ attributes.content }</RawHTML>,
					],
				};
			},
		},
	],

	merge( attributes, attributesToMerge ) {
		return {
			content: concatChildren( attributes.content, attributesToMerge.content ),
		};
	},

	getEditWrapperProps( attributes ) {
		const { width } = attributes;
		if ( [ 'wide', 'full', 'left', 'right' ].indexOf( width ) !== -1 ) {
			return { 'data-align': width };
		}
	},

	edit: compose(
		withColors,
		FallbackStyles,
	)( ParagraphBlock ),

	save( { attributes } ) {
		const {
			align,
			content,
			dropCap,
			backgroundColor,
			textColor,
			customBackgroundColor,
			customTextColor,
			fontSize,
			customFontSize,
		} = attributes;

		const textClass = getColorClass( 'color', textColor );
		const backgroundClass = getColorClass( 'background-color', backgroundColor );
		const fontSizeClass = fontSize && FONT_SIZES[ fontSize ] && `is-${ fontSize }-text`;

		const className = classnames( {
			'has-background': backgroundColor || customBackgroundColor,
			'has-drop-cap': dropCap,
			[ fontSizeClass ]: fontSizeClass,
			[ textClass ]: textClass,
			[ backgroundClass ]: backgroundClass,
		} );

		const styles = {
			backgroundColor: backgroundClass ? undefined : customBackgroundColor,
			color: textClass ? undefined : customTextColor,
			fontSize: fontSizeClass ? undefined : customFontSize,
			textAlign: align,
		};

		return (
			<RichText.Content
				tagName="p"
				style={ styles }
				className={ className ? className : undefined }
				value={ content }
			/>
		);
	},
};
