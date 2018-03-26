/**
 * External dependencies
 */
import classnames from 'classnames';
import { findKey, map } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	Button,
	ButtonGroup,
	IconButton,
	PanelBody,
	PanelColor,
	RangeControl,
	ToggleControl,
	Toolbar,
} from '@wordpress/components';

import { __ } from '@wordpress/i18n';

import {
	AlignmentToolbar,
	BlockControls,
	ColorPalette,
	ImagePlaceholder,
	InspectorControls,
	MediaUpload,
	RichText,
} from '@wordpress/blocks';

import './editor.scss';

const FONT_SIZES = {
	small: 14,
	regular: 16,
	large: 36,
	larger: 48,
};

export const name = 'dynamic/article';

export const settings = {
	title: 'Article',

	description: __( 'Article has an image and a title.' ),

	icon: 'universal-access-alt',

	category: 'common',

	attributes: {
		title: {
			type: 'array',
			source: 'children',
			selector: 'p',
		},
		url: {
			type: 'string',
		},
		textAlign: {
			type: 'string',
			default: 'left',
		},
		id: {
			type: 'number',
		},
		hasParallax: {
			type: 'boolean',
			default: false,
		},
		dimRatio: {
			type: 'number',
			default: 0,
		},
		textColor: {
			type: 'string',
		},
		backgroundColor: {
			type: 'string',
		},
		fontSize: {
			type: 'string',
		},
		customFontSize: {
			type: 'number',
		},
	},

	edit( { attributes, setAttributes, isSelected, className } ) {
		const { url, title, textAlign, id, hasParallax, dimRatio, textColor, backgroundColor, customFontSize } = attributes;
		let { fontSize } = attributes;

		// image events
		const onSelectImage = ( media ) => setAttributes( { url: media.url, id: media.id } );
		const toggleParallax = () => setAttributes( { hasParallax: ! hasParallax } );
		const setDimRatio = ( ratio ) => setAttributes( { dimRatio: ratio } );

		// text events
		const getFontSize = () => {
			if ( fontSize ) {
				return FONT_SIZES[ fontSize ];
			}

			if ( customFontSize ) {
				return customFontSize;
			}
		};

		fontSize = getFontSize();

		const setFontSize = ( fontSizeValue ) => {
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
		};

		const style = url ? { backgroundImage: `url(${ url })` } : undefined;

		const classes = classnames(
			'wp-block-cover-image',
			dimRatioToClass( dimRatio ),
			{
				'has-background-dim': dimRatio !== 0,
				'has-parallax': hasParallax,
			}
		);

		const alignmentToolbar	= (
			<AlignmentToolbar
				value={ textAlign }
				onChange={ ( nextAlign ) => {
					setAttributes( { textAlign: nextAlign } );
				} }
			/>
		);

		const controls = isSelected && [
			<BlockControls key="controls">
				{ alignmentToolbar }
				<Toolbar>
					<MediaUpload
						onSelect={ onSelectImage }
						type="image"
						value={ id }
						render={ ( { open } ) => (
							<IconButton
								className="components-toolbar__control"
								label={ __( 'Edit image' ) }
								icon="edit"
								onClick={ open }
							/>
						) }
					/>
				</Toolbar>
			</BlockControls>,
			<InspectorControls key="inspector">
				<h2>{ __( 'Article Image Settings' ) }</h2>
				<ToggleControl
					label={ __( 'Fixed Background' ) }
					checked={ !! hasParallax }
					onChange={ toggleParallax }
				/>
				<RangeControl
					label={ __( 'Background Dimness' ) }
					value={ dimRatio }
					onChange={ setDimRatio }
					min={ 0 }
					max={ 100 }
					step={ 10 }
				/>
				<PanelBody title={ __( 'Text Settings' ) }>
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
									onClick={ () => setFontSize( FONT_SIZES[ size ] ) }
								>
									{ label }
								</Button>
							) ) }
						</ButtonGroup>
						<Button
							isLarge
							onClick={ () => setFontSize( undefined ) }
						>
							{ __( 'Reset' ) }
						</Button>
					</div>
					<RangeControl
						label={ __( 'Custom Size' ) }
						value={ fontSize || '' }
						onChange={ ( value ) => setFontSize( value ) }
						min={ 12 }
						max={ 100 }
						beforeIcon="editor-textcolor"
						afterIcon="editor-textcolor"
					/>
					{ alignmentToolbar }
				</PanelBody>
				<PanelColor title={ __( 'Background Color' ) } colorValue={ backgroundColor } initialOpen={ false }>
					<ColorPalette
						value={ backgroundColor }
						onChange={ ( colorValue ) => setAttributes( { backgroundColor: colorValue } ) }
					/>
				</PanelColor>
				<PanelColor title={ __( 'Text Color' ) } colorValue={ textColor } initialOpen={ false }>
					<ColorPalette
						value={ textColor }
						onChange={ ( colorValue ) => setAttributes( { textColor: colorValue } ) }
					/>
				</PanelColor>
			</InspectorControls>,
		];

		const richText = (
			<RichText
				key="title"
				tagName="p"
				placeholder={ __( 'Write a title…' ) }
				value={ title }
				className={ classnames(
					'wp-block-paragraph',
					className,
					{ 'has-background': backgroundColor },
				) }
				style={ {
					backgroundColor: backgroundColor,
					color: textColor,
					fontSize: fontSize ? fontSize + 'px' : undefined,
					textAlign: textAlign,
				} }
				onChange={ ( value ) => setAttributes( { title: value } ) }
				isSelected={ isSelected }
				inlineToolbar
			/>
		);

		if ( ! url ) {
			const icon = 'format-image';
			const label = __( 'Article image' );

			return [
				controls,
				<ImagePlaceholder
					key="cover-image-placeholder"
					{ ...{ className, icon, label, onSelectImage } }
				/>,
				richText,
			];
		}

		return [
			controls,
			<section
				key="preview"
				data-url={ url }
				style={ style }
				className={ classes }
			/>,
			( title || isSelected ? richText : null ),
		];
	},

	save( { attributes, className } ) {
		const { url, title, textAlign, hasParallax, dimRatio, textColor, backgroundColor, fontSize, customFontSize } = attributes;

		const imageStyle = url ? { backgroundImage: `url(${ url })` } : undefined;
		const imageClasses = classnames(
			'wp-block-cover-image',
			dimRatioToClass( dimRatio ),
			{
				'has-background-dim': dimRatio !== 0,
				'has-parallax': hasParallax,
			},
		);

		const textStyle = {
			backgroundColor: backgroundColor,
			color: textColor,
			fontSize: ! fontSize && customFontSize ? customFontSize : undefined,
			textAlign: textAlign,
		};

		const textClasses = classnames( {
			'has-background': backgroundColor,
			[ `is-${ fontSize }-text` ]: fontSize && FONT_SIZES[ fontSize ],
		} );

		return (
			<div className={ className }>
				<section className={ imageClasses ? imageClasses : undefined } style={ imageStyle }></section>
				<p className={ textClasses ? textClasses : undefined } style={ textStyle }>{ title }</p>
			</div>
		);
	},
};

function dimRatioToClass( ratio ) {
	return ( ratio === 0 || ratio === 50 ) ?
		null :
		'has-background-dim-' + ( 10 * Math.round( ratio / 10 ) );
}
