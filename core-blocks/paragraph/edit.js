/**
 * External dependencies
 */
import classnames from 'classnames';
import { find } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Component,
	Fragment,
} from '@wordpress/element';
import {
	FontSizePicker,
	PanelBody,
	ToggleControl,
	withFallbackStyles,
} from '@wordpress/components';
import {
	withColors,
	AlignmentToolbar,
	BlockControls,
	ContrastChecker,
	InspectorControls,
	PanelColor,
	RichText,
} from '@wordpress/editor';
import {
	createBlock,
} from '@wordpress/blocks';
import { compose } from '@wordpress/compose';

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

const name = 'core/paragraph';

class ParagraphBlock extends Component {
	constructor() {
		super( ...arguments );

		this.onReplace = this.onReplace.bind( this );
		this.toggleDropCap = this.toggleDropCap.bind( this );
		this.getFontSize = this.getFontSize.bind( this );
		this.setFontSize = this.setFontSize.bind( this );
		this.splitBlock = this.splitBlock.bind( this );
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

	/**
	 * Split handler for RichText value, namely when content is pasted or the
	 * user presses the Enter key.
	 *
	 * @param {?Array}     before Optional before value, to be used as content
	 *                            in place of what exists currently for the
	 *                            block. If undefined, the block is deleted.
	 * @param {?Array}     after  Optional after value, to be appended in a new
	 *                            paragraph block to the set of blocks passed
	 *                            as spread.
	 * @param {...WPBlock} blocks Optional blocks inserted between the before
	 *                            and after value blocks.
	 */
	splitBlock( before, after, ...blocks ) {
		const {
			attributes,
			insertBlocksAfter,
			setAttributes,
			onReplace,
		} = this.props;

		if ( after ) {
			// Append "After" content as a new paragraph block to the end of
			// any other blocks being inserted after the current paragraph.
			blocks.push( createBlock( name, { content: after } ) );
		}

		if ( blocks.length && insertBlocksAfter ) {
			insertBlocksAfter( blocks );
		}

		const { content } = attributes;
		if ( ! before ) {
			// If before content is omitted, treat as intent to delete block.
			onReplace( [] );
		} else if ( content !== before ) {
			// Only update content if it has in-fact changed. In case that user
			// has created a new paragraph at end of an existing one, the value
			// of before will be strictly equal to the current content.
			setAttributes( { content: before } );
		}
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
							fontSize,
							fallbackBackgroundColor,
							fallbackTextColor,
						} }
					/>
				</InspectorControls>
				<RichText
					tagName="p"
					className={ classnames( 'wp-block-paragraph', className, {
						'has-background': backgroundColor.value,
						'has-drop-cap': dropCap,
						[ backgroundColor.class ]: backgroundColor.class,
						[ textColor.class ]: textColor.class,
					} ) }
					style={ {
						backgroundColor: backgroundColor.value,
						color: textColor.value,
						fontSize: fontSize ? fontSize + 'px' : undefined,
						textAlign: align,
					} }
					value={ content }
					onChange={ ( nextContent ) => {
						setAttributes( {
							content: nextContent,
						} );
					} }
					onSplit={ this.splitBlock }
					onMerge={ mergeBlocks }
					onReplace={ this.onReplace }
					onRemove={ () => onReplace( [] ) }
					placeholder={ placeholder || __( 'Add text or type / to add content' ) }
				/>
			</Fragment>
		);
	}
}

const ParagraphEdit = compose( [
	withColors( 'backgroundColor', { textColor: 'color' } ),
	FallbackStyles,
] )( ParagraphBlock );

export default ParagraphEdit;
