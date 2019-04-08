/**
 * External dependencies
 */
import classnames from 'classnames';
import { isFinite, omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	RawHTML,
} from '@wordpress/element';
import {
	getColorClassName,
	getFontSizeClass,
	RichText,
} from '@wordpress/block-editor';
import { getPhrasingContentSchema } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import edit from './edit';
import icon from './icon';

const supports = {
	className: false,
};

const schema = {
	content: {
		type: 'string',
		source: 'html',
		selector: 'p',
		default: '',
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
	direction: {
		type: 'string',
		enum: [ 'ltr', 'rtl' ],
	},
};

export const name = 'core/paragraph';

export const settings = {
	title: __( 'Paragraph' ),

	description: __( 'Start with the building block of all narrative.' ),

	icon,

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

				const textClass = getColorClassName( 'color', textColor );
				const backgroundClass = getColorClassName( 'background-color', backgroundColor );
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
					backgroundColor,
					color: textColor,
					fontSize,
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
	],

	merge( attributes, attributesToMerge ) {
		return {
			content: ( attributes.content || '' ) + ( attributesToMerge.content || '' ),
		};
	},

	getEditWrapperProps( attributes ) {
		const { width } = attributes;
		if ( [ 'wide', 'full', 'left', 'right' ].indexOf( width ) !== -1 ) {
			return { 'data-align': width };
		}
	},

	edit,

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
		const backgroundClass = getColorClassName( 'background-color', backgroundColor );
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
				dir={ direction }
			/>
		);
	},
};
