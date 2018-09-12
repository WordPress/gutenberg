/**
 * External dependencies
 */
import { get, includes } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	getColorClassName,
	RichText,
	getColorObjectByAttributeValues,
} from '@wordpress/editor';
import {
	select,
} from '@wordpress/data';

import {
	default as edit,
	SOLID_COLOR_STYLE_NAME,
	SOLID_COLOR_CLASS,
	toRichTextValue,
} from './edit';

const blockAttributes = {
	value: {
		type: 'array',
		source: 'query',
		selector: 'blockquote > p',
		query: {
			children: {
				source: 'node',
			},
		},
	},
	citation: {
		type: 'array',
		source: 'children',
		selector: 'cite',
	},
	mainColor: {
		type: 'string',
	},
	customMainColor: {
		type: 'string',
	},
	textColor: {
		type: 'string',
	},
	customTextColor: {
		type: 'string',
	},
};

export const name = 'core/pullquote';

export const settings = {

	title: __( 'Pullquote' ),

	description: __( 'Highlight a quote from your post or page by displaying it as a graphic element.' ),

	icon: <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M0,0h24v24H0V0z" fill="none" /><polygon points="21 18 2 18 2 20 21 20" /><path d="m19 10v4h-15v-4h15m1-2h-17c-0.55 0-1 0.45-1 1v6c0 0.55 0.45 1 1 1h17c0.55 0 1-0.45 1-1v-6c0-0.55-0.45-1-1-1z" /><polygon points="21 4 2 4 2 6 21 6" /></svg>,

	category: 'formatting',

	attributes: blockAttributes,

	styles: [
		{ name: 'default', label: __( 'Regular' ), isDefault: true },
		{ name: SOLID_COLOR_STYLE_NAME, label: __( 'Solid Color' ) },
	],

	supports: {
		align: true,
	},

	edit,

	save( { attributes } ) {
		const { mainColor, customMainColor, textColor, customTextColor, value, citation, className } = attributes;
		const isSolidColorStyle = includes( className, SOLID_COLOR_CLASS );

		let figureClass, figureStyles;
		// Is solid color style
		if ( isSolidColorStyle ) {
			figureClass = getColorClassName( 'background-color', mainColor );
			if ( ! figureClass ) {
				figureStyles = {
					backgroundColor: customMainColor,
				};
			}
		// Is normal style and a custom color is being used ( we can set a style directly with its value)
		} else if ( customMainColor ) {
			figureStyles = {
				borderColor: customMainColor,
			};
		// Is normal style and a named color is being used, we need to retrieve the color value to set the style,
		// as there is no expectation that themes create classes that set border colors.
		} else if ( mainColor ) {
			const colors = get( select( 'core/editor' ).getEditorSettings(), [ 'colors' ], [] );
			const colorObject = getColorObjectByAttributeValues( colors, mainColor );
			figureStyles = {
				borderColor: colorObject.color,
			};
		}

		const blockquoteClass = getColorClassName( 'color', textColor );
		const blockquoteStyle = blockquoteClass ? undefined : { color: customTextColor };
		return (
			<figure className={ figureClass } style={ figureStyles }>
				<blockquote className={ blockquoteClass } style={ blockquoteStyle } >
					<RichText.Content value={ toRichTextValue( value ) } />
					{ ! RichText.isEmpty( citation ) && <RichText.Content tagName="cite" value={ citation } /> }
				</blockquote>
			</figure>
		);
	},

	deprecated: [ {
		attributes: {
			...blockAttributes,
		},
		save( { attributes } ) {
			const { value, citation } = attributes;
			return (
				<blockquote>
					<RichText.Content value={ toRichTextValue( value ) } />
					{ ! RichText.isEmpty( citation ) && <RichText.Content tagName="cite" value={ citation } /> }
				</blockquote>
			);
		},
	}, {
		attributes: {
			...blockAttributes,
			citation: {
				type: 'array',
				source: 'children',
				selector: 'footer',
			},
			align: {
				type: 'string',
				default: 'none',
			},
		},

		save( { attributes } ) {
			const { value, citation, align } = attributes;

			return (
				<blockquote className={ `align${ align }` }>
					<RichText.Content value={ toRichTextValue( value ) } />
					{ ! RichText.isEmpty( citation ) && <RichText.Content tagName="footer" value={ citation } /> }
				</blockquote>
			);
		},
	} ],
};
