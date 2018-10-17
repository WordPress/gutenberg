/**
 * External dependencies
 */
import classnames from 'classnames';
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
	BORDER_COLOR_STYLE_NAME,
	BORDER_COLOR_CLASS,
} from './edit';

const blockAttributes = {
	value: {
		source: 'html',
		selector: 'blockquote',
		multiline: 'p',
	},
	citation: {
		source: 'html',
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
		{ name: SOLID_COLOR_STYLE_NAME, label: __( 'Solid' ), isDefault: true },
		{ name: BORDER_COLOR_STYLE_NAME, label: __( 'Border' ) },
	],

	supports: {
		align: [ 'left', 'right', 'wide', 'full' ],
	},

	edit,

	save( { attributes } ) {
		const { mainColor, customMainColor, textColor, customTextColor, value, citation, className } = attributes;
		const isBorderColorStyle = includes( className, BORDER_COLOR_CLASS );

		let figureClass, figureStyles;
		// Is border color style.
		if ( isBorderColorStyle ) {
			// Is border style and a custom color is being used ( we can set a style directly with its value).
			if ( customMainColor ) {
				figureStyles = {
					borderColor: customMainColor,
				};
				// Is border style and a named color is being used, we need to retrieve the color value to set the style,
				// as there is no expectation that themes create classes that set border colors.
			} else if ( mainColor ) {
				const colors = get( select( 'core/editor' ).getEditorSettings(), [ 'colors' ], [] );
				const colorObject = getColorObjectByAttributeValues( colors, mainColor );
				figureStyles = {
					borderColor: colorObject.color,
				};
			}
		// Is default style.
		} else {
			figureClass = getColorClassName( 'background-color', mainColor );
			if ( ! figureClass ) {
				figureStyles = {
					backgroundColor: customMainColor,
				};
			}
		}

		const blockquoteTextColorClass = getColorClassName( 'color', textColor );
		const blockquoteClasses = textColor || customTextColor ? classnames( 'has-text-color', {
			[ blockquoteTextColorClass ]: blockquoteTextColorClass,
		} ) : undefined;
		const blockquoteStyle = blockquoteTextColorClass ? undefined : { color: customTextColor };
		return (
			<figure className={ figureClass } style={ figureStyles }>
				<blockquote className={ blockquoteClasses } style={ blockquoteStyle } >
					<RichText.Content value={ value } multiline />
					{ ! RichText.isEmpty( citation ) && <RichText.Content tagName="cite" value={ citation } /> }
				</blockquote>
			</figure>
		);
	},

	deprecated: [ {
		attributes: {
			...blockAttributes,
		},
		// pull quote version where the default style was the version with border color.
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

			const blockquoteTextColorClass = getColorClassName( 'color', textColor );
			const blockquoteClasses = textColor || customTextColor ? classnames( 'has-text-color', {
				[ blockquoteTextColorClass ]: blockquoteTextColorClass,
			} ) : undefined;
			const blockquoteStyle = blockquoteTextColorClass ? undefined : { color: customTextColor };
			return (
				<figure className={ figureClass } style={ figureStyles }>
					<blockquote className={ blockquoteClasses } style={ blockquoteStyle } >
						<RichText.Content value={ value } multiline="p" />
						{ ! RichText.isEmpty( citation ) && <RichText.Content tagName="cite" value={ citation } /> }
					</blockquote>
				</figure>
			);
		},
		migrate: function( attributes ) {
			if ( includes( attributes.className, SOLID_COLOR_CLASS ) ) {
				// Block using the solid color style, markup is still tottaly valid and it should render as expected,
				// we cam just use the same attributes as before.
				return attributes;
			}

			// Block using the border color style (previous default),
			// with some customization's that made the validation fail.
			// Update its className to include a reference to the previous default color style,
			// as classes for default class are not included.
			let className = BORDER_COLOR_CLASS;
			if ( attributes.className ) {
				className = `${ BORDER_COLOR_CLASS } ${ attributes.className }`;
			}
			return {
				...attributes,
				className,
			};
		},
	}, {
		attributes: {
			...blockAttributes,
		},
		save( { attributes } ) {
			const { value, citation } = attributes;
			return (
				<blockquote>
					<RichText.Content value={ value } multiline />
					{ ! RichText.isEmpty( citation ) && <RichText.Content tagName="cite" value={ citation } /> }
				</blockquote>
			);
		},
	}, {
		attributes: {
			...blockAttributes,
			citation: {
				source: 'html',
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
					<RichText.Content value={ value } multiline />
					{ ! RichText.isEmpty( citation ) && <RichText.Content tagName="footer" value={ citation } /> }
				</blockquote>
			);
		},
	} ],
};
