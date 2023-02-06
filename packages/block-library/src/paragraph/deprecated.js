/**
 * External dependencies
 */
import classnames from 'classnames';

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

const { style, ...restBlockAttributes } = blockAttributes;

const deprecated = [
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
		save( { attributes } ) {
			const { align, content, dropCap, direction } = attributes;
			const className = classnames( {
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
		migrate: migrateCustomColorsAndFontSizes,
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

			const className = classnames( {
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
		migrate: migrateCustomColorsAndFontSizes,
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

			const className = classnames( {
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
		migrate: migrateCustomColorsAndFontSizes,
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

			const className = classnames( {
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
			const className = classnames( {
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
			return migrateCustomColorsAndFontSizes( {
				...attributes,
				customFontSize: Number.isFinite( attributes.fontSize )
					? attributes.fontSize
					: undefined,
				customTextColor:
					attributes.textColor && '#' === attributes.textColor[ 0 ]
						? attributes.textColor
						: undefined,
				customBackgroundColor:
					attributes.backgroundColor &&
					'#' === attributes.backgroundColor[ 0 ]
						? attributes.backgroundColor
						: undefined,
			} );
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
		migrate( attributes ) {
			return attributes;
		},
	},
];

export default deprecated;
