/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { RawHTML } from '@wordpress/element';
import {
	getColorClassName,
	getFontSizeClass,
	RichText,
	useBlockProps,
} from '@wordpress/block-editor';

import { isRTL } from '@wordpress/i18n';

const supports = {
	className: false,
};

const blockAttributes = {
	align: {
		type: 'string',
	},
	content: {
		type: 'string',
		source: 'html',
		selector: 'p',
		default: '',
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
	backgroundColor: {
		type: 'string',
	},
	fontSize: {
		type: 'string',
	},
	direction: {
		type: 'string',
		enum: [ 'ltr', 'rtl' ],
	},
	style: {
		type: 'object',
	},
};

const migrateCustomColorsAndFontSizes = ( attributes ) => {
	if (
		! attributes.customTextColor &&
		! attributes.customBackgroundColor &&
		! attributes.customFontSize
	) {
		return attributes;
	}
	const style = {};
	if ( attributes.customTextColor || attributes.customBackgroundColor ) {
		style.color = {};
	}
	if ( attributes.customTextColor ) {
		style.color.text = attributes.customTextColor;
	}
	if ( attributes.customBackgroundColor ) {
		style.color.background = attributes.customBackgroundColor;
	}
	if ( attributes.customFontSize ) {
		style.typography = { fontSize: attributes.customFontSize };
	}

	const {
		customTextColor,
		customBackgroundColor,
		customFontSize,
		...restAttributes
	} = attributes;

	return {
		...restAttributes,
		style,
	};
};

const migrateTextAlign = ( attributes ) => {
	const { align, className, ...restAttributes } = attributes;
	if ( ! align ) {
		return attributes;
	}
	const cleanedClassName = className
		? className
				.split( ' ' )
				.filter(
					( cls ) =>
						! cls.startsWith( 'has-text-align-' ) &&
						! cls.endsWith( '-color' ) &&
						! cls.endsWith( '-background-color' ) &&
						cls !== 'has-text-color' &&
						cls !== 'has-background' &&
						! cls.startsWith( 'has-drop-cap' )
				)
				.join( ' ' ) || undefined
		: undefined;
	return {
		...restAttributes,
		className: cleanedClassName,
		style: {
			...attributes.style,
			typography: {
				...attributes.style?.typography,
				textAlign: align,
			},
		},
	};
};

const { style, ...restBlockAttributes } = blockAttributes;

// Supports matching the current block type for use in the healing
// deprecation entry below. textAlign support is included so that
// getSaveContent produces the has-text-align-* class, allowing
// validation to pass against blocks that have it in their HTML.
const currentSupports = {
	className: false,
	typography: {
		textAlign: true,
	},
};

const deprecated = [
	// Version with leaked color/background classes in className.
	// Heals already-corrupted blocks produced by earlier migrations.
	{
		supports: currentSupports,
		attributes: {
			...restBlockAttributes,
			className: {
				type: 'string',
			},
		},
		isEligible( attributes ) {
			return !! attributes.className?.match(
				/\b(?:has-text-color|has-background|has-[a-z0-9-]+-color|has-[a-z0-9-]+-background-color)\b/
			);
		},
		save( { attributes } ) {
			const { content, dropCap, direction } = attributes;
			const textAlign = attributes.style?.typography?.textAlign;
			const className = clsx( {
				'has-drop-cap':
					textAlign === ( isRTL() ? 'left' : 'right' ) ||
					textAlign === 'center'
						? false
						: dropCap,
			} );
			return (
				<p { ...useBlockProps.save( { className, dir: direction } ) }>
					<RichText.Content value={ content } />
				</p>
			);
		},
		migrate( attributes ) {
			const { className, ...restAttributes } = attributes;
			const cleanedClassName =
				className
					?.split( ' ' )
					.filter(
						( cls ) =>
							! cls.startsWith( 'has-text-align-' ) &&
							! cls.endsWith( '-color' ) &&
							! cls.endsWith( '-background-color' ) &&
							cls !== 'has-text-color' &&
							cls !== 'has-background' &&
							! cls.startsWith( 'has-drop-cap' )
					)
					.join( ' ' ) || undefined;
			return { ...restAttributes, className: cleanedClassName };
		},
	},
	// Version with `align` attribute.
	{
		supports: {
			className: false,
			typography: {
				fontSize: true,
			},
		},
		attributes: blockAttributes,
		isEligible( attributes ) {
			return (
				!! attributes.align ||
				!! attributes.className?.match(
					/\bhas-text-align-(left|center|right)\b/
				)
			);
		},
		save( { attributes } ) {
			const { align, content, dropCap, direction } = attributes;
			const className = clsx( {
				'has-drop-cap':
					align === ( isRTL() ? 'left' : 'right' ) ||
					align === 'center'
						? false
						: dropCap,
				[ `has-text-align-${ align }` ]: align,
			} );

			return (
				<p { ...useBlockProps.save( { className, dir: direction } ) }>
					<RichText.Content value={ content } />
				</p>
			);
		},
		migrate: migrateTextAlign,
	},
	// Version without drop cap on aligned text.
	{
		supports,
		attributes: {
			...restBlockAttributes,
			customTextColor: {
				type: 'string',
			},
			customBackgroundColor: {
				type: 'string',
			},
			customFontSize: {
				type: 'number',
			},
		},
		migrate: migrateTextAlign,
		save( { attributes } ) {
			const { align, content, dropCap, direction } = attributes;
			const className = clsx( {
				'has-drop-cap':
					align === ( isRTL() ? 'left' : 'right' ) ||
					align === 'center'
						? false
						: dropCap,
				[ `has-text-align-${ align }` ]: align,
			} );

			return (
				<p { ...useBlockProps.save( { className, dir: direction } ) }>
					<RichText.Content value={ content } />
				</p>
			);
		},
	},
	{
		supports,
		attributes: {
			...restBlockAttributes,
			customTextColor: {
				type: 'string',
			},
			customBackgroundColor: {
				type: 'string',
			},
			customFontSize: {
				type: 'number',
			},
		},
		migrate( attributes ) {
			return migrateCustomColorsAndFontSizes(
				migrateTextAlign( attributes )
			);
		},
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
				direction,
			} = attributes;

			const textClass = getColorClassName( 'color', textColor );
			const backgroundClass = getColorClassName(
				'background-color',
				backgroundColor
			);
			const fontSizeClass = getFontSizeClass( fontSize );

			const className = clsx( {
				'has-text-color': textColor || customTextColor,
				'has-background': backgroundColor || customBackgroundColor,
				'has-drop-cap': dropCap,
				[ `has-text-align-${ align }` ]: align,
				[ fontSizeClass ]: fontSizeClass,
				[ textClass ]: textClass,
				[ backgroundClass ]: backgroundClass,
			} );

			const styles = {
				backgroundColor: backgroundClass
					? undefined
					: customBackgroundColor,
				color: textClass ? undefined : customTextColor,
				fontSize: fontSizeClass ? undefined : customFontSize,
			};

			return (
				<RichText.Content
					tagName="p"
					style={ styles }
					className={ className ? className : undefined }
					value={ content }
					dir={ direction }
				/>
			);
		},
	},
	{
		supports,
		attributes: {
			...restBlockAttributes,
			customTextColor: {
				type: 'string',
			},
			customBackgroundColor: {
				type: 'string',
			},
			customFontSize: {
				type: 'number',
			},
		},
		migrate( attributes ) {
			return migrateCustomColorsAndFontSizes(
				migrateTextAlign( attributes )
			);
		},
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
				direction,
			} = attributes;

			const textClass = getColorClassName( 'color', textColor );
			const backgroundClass = getColorClassName(
				'background-color',
				backgroundColor
			);
			const fontSizeClass = getFontSizeClass( fontSize );

			const className = clsx( {
				'has-text-color': textColor || customTextColor,
				'has-background': backgroundColor || customBackgroundColor,
				'has-drop-cap': dropCap,
				[ fontSizeClass ]: fontSizeClass,
				[ textClass ]: textClass,
				[ backgroundClass ]: backgroundClass,
			} );

			const styles = {
				backgroundColor: backgroundClass
					? undefined
					: customBackgroundColor,
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
					dir={ direction }
				/>
			);
		},
	},
	{
		supports,
		attributes: {
			...restBlockAttributes,
			customTextColor: {
				type: 'string',
			},
			customBackgroundColor: {
				type: 'string',
			},
			customFontSize: {
				type: 'number',
			},
			width: {
				type: 'string',
			},
		},
		migrate( attributes ) {
			return migrateCustomColorsAndFontSizes(
				migrateTextAlign( attributes )
			);
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

			const textClass = getColorClassName( 'color', textColor );
			const backgroundClass = getColorClassName(
				'background-color',
				backgroundColor
			);
			const fontSizeClass = fontSize && `is-${ fontSize }-text`;

			const className = clsx( {
				[ `align${ width }` ]: width,
				'has-background': backgroundColor || customBackgroundColor,
				'has-drop-cap': dropCap,
				[ fontSizeClass ]: fontSizeClass,
				[ textClass ]: textClass,
				[ backgroundClass ]: backgroundClass,
			} );

			const styles = {
				backgroundColor: backgroundClass
					? undefined
					: customBackgroundColor,
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
		attributes: {
			...restBlockAttributes,
			fontSize: {
				type: 'number',
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
				fontSize,
			} = attributes;
			const className = clsx( {
				[ `align${ width }` ]: width,
				'has-background': backgroundColor,
				'has-drop-cap': dropCap,
			} );
			const styles = {
				backgroundColor,
				color: textColor,
				fontSize,
				textAlign: align,
			};

			return (
				<p
					style={ styles }
					className={ className ? className : undefined }
				>
					{ content }
				</p>
			);
		},
		migrate( attributes ) {
			return migrateCustomColorsAndFontSizes(
				migrateTextAlign( {
					...attributes,
					customFontSize: Number.isFinite( attributes.fontSize )
						? attributes.fontSize
						: undefined,
					customTextColor:
						attributes.textColor &&
						'#' === attributes.textColor[ 0 ]
							? attributes.textColor
							: undefined,
					customBackgroundColor:
						attributes.backgroundColor &&
						'#' === attributes.backgroundColor[ 0 ]
							? attributes.backgroundColor
							: undefined,
				} )
			);
		},
	},
	{
		supports,
		attributes: {
			...blockAttributes,
			content: {
				type: 'string',
				source: 'html',
				default: '',
			},
		},
		save( { attributes } ) {
			return <RawHTML>{ attributes.content }</RawHTML>;
		},
		migrate: ( attributes ) => attributes,
	},
];

export default deprecated;
