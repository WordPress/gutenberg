/**
 * External dependencies
 */
import classnames from 'classnames';
import { isFinite, find, last, omit } from 'lodash';

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
	FontSizePicker,
	PanelBody,
	ToggleControl,
	withFallbackStyles,
} from '@wordpress/components';
import {
	getColorClass,
	withColors,
	AlignmentToolbar,
	BlockControls,
	ContrastChecker,
	InspectorControls,
	PanelColor,
	RichText,
} from '@wordpress/editor';
import { createBlock, getPhrasingContentSchema } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
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

const FONT_SIZES = [
	{
		name: 'small',
		shortName: 'S',
		size: 14,
	},
	{
		name: 'regular',
		shortName: 'M',
		size: 16,
	},
	{
		name: 'large',
		shortName: 'L',
		size: 36,
	},
	{
		name: 'larger',
		shortName: 'XL',
		size: 48,
	},
];

class ParagraphBlock extends Component {
	constructor() {
		super( ...arguments );
		this.onReplace = this.onReplace.bind( this );
		this.toggleDropCap = this.toggleDropCap.bind( this );
		this.getFontSize = this.getFontSize.bind( this );
		this.setFontSize = this.setFontSize.bind( this );
	}

	onReplace( blocks, blockToSelect ) {
		const { attributes, onReplace } = this.props;
		onReplace( blocks.map( ( block, index ) => (
			index === 0 && block.name === name ?
				{ ...block,
					attributes: {
						...attributes,
						...block.attributes,
					},
					uid: this.props.id,
				} :
				block
		) ), blockToSelect );
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
			const fontSizeObj = find( FONT_SIZES, { name: fontSize } );
			if ( fontSizeObj ) {
				return fontSizeObj.size;
			}
		}

		if ( customFontSize ) {
			return customFontSize;
		}
	}

	setFontSize( fontSizeValue ) {
		const { setAttributes } = this.props;
		const thresholdFontSize = find( FONT_SIZES, { size: fontSizeValue } );
		if ( thresholdFontSize ) {
			setAttributes( {
				fontSize: thresholdFontSize.name,
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
			backgroundColor,
			textColor,
			setBackgroundColor,
			setTextColor,
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
						<FontSizePicker
							fontSizes={ FONT_SIZES }
							fallbackFontSize={ fallbackFontSize }
							value={ fontSize }
							onChange={ this.setFontSize }
						/>
						<ToggleControl
							label={ __( 'Drop Cap' ) }
							checked={ !! dropCap }
							onChange={ this.toggleDropCap }
							help={ this.getDropCapHelp }
						/>
					</PanelBody>
					<PanelColor
						colorValue={ backgroundColor.value }
						initialOpen={ false }
						title={ __( 'Background Color' ) }
						onChange={ setBackgroundColor }
					/>
					<PanelColor
						colorValue={ textColor.value }
						initialOpen={ false }
						title={ __( 'Text Color' ) }
						onChange={ setTextColor }
					/>
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
								if ( after ) {
									blocks.push( createBlock( name, { content: after } ) );
								}
								const replaceArrayStart = before ?
									[ createBlock( name, { ...attributes, content: before } ) ] :
									[];

								const newBlocks = replaceArrayStart.concat( blocks );
								this.onReplace( newBlocks, newBlocks.length > 1 ? last( newBlocks ).uid : undefined );
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

const schema = {
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

	description: __( 'Add some basic text.' ),

	icon: 'editor-paragraph',

	category: 'common',

	keywords: [ __( 'text' ) ],

	supports,

	attributes: schema,

	transforms: {
		from: [
			{
				type: 'raw',
				// Paragraph is a fallback and should be matched last.
				priority: 20,
				selector: 'p',
				schema: {
					p: {
						children: getPhrasingContentSchema(),
					},
				},
			},
		],
	},

	deprecated: [
		{
			supports,
			attributes: {
				...schema,
				width: {
					type: 'string',
				},
			},
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
				const fontSizeClass = fontSize && `is-${ fontSize }-text`;

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
		withColors( ( getColor, setColor, { attributes } ) => {
			return {
				backgroundColor: getColor( attributes.backgroundColor, attributes.customBackgroundColor, 'background-color' ),
				setBackgroundColor: setColor( 'backgroundColor', 'customBackgroundColor' ),
				textColor: getColor( attributes.textColor, attributes.customTextColor, 'color' ),
				setTextColor: setColor( 'textColor', 'customTextColor' ),
			};
		} ),
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
		const fontSizeClass = fontSize && `is-${ fontSize }-text`;

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
