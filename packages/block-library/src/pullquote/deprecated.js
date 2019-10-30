/**
 * External dependencies
 */
import classnames from 'classnames';
import { get, includes } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	getColorClassName,
	getColorObjectByAttributeValues,
	RichText,
} from '@wordpress/block-editor';
import {
	select,
} from '@wordpress/data';

/**
 * Internal dependencies
 */
import { SOLID_COLOR_CLASS } from './shared';

const blockAttributes = {
	value: {
		type: 'string',
		source: 'html',
		selector: 'blockquote',
		multiline: 'p',
	},
	citation: {
		type: 'string',
		source: 'html',
		selector: 'cite',
		default: '',
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

const deprecated = [
	{
		attributes: blockAttributes,
		save( { attributes } ) {
			const {
				mainColor,
				customMainColor,
				textColor,
				customTextColor,
				value,
				citation,
				className,
			} = attributes;

			const isSolidColorStyle = includes( className, SOLID_COLOR_CLASS );

			let figureClasses, figureStyles;

			// Is solid color style
			if ( isSolidColorStyle ) {
				const backgroundClass = getColorClassName( 'background-color', mainColor );

				figureClasses = classnames( {
					'has-background': ( backgroundClass || customMainColor ),
					[ backgroundClass ]: backgroundClass,
				} );

				figureStyles = {
					backgroundColor: backgroundClass ? undefined : customMainColor,
				};
			// Is normal style and a custom color is being used ( we can set a style directly with its value)
			} else if ( customMainColor ) {
				figureStyles = {
					borderColor: customMainColor,
				};
			// If normal style and a named color are being used, we need to retrieve the color value to set the style,
			// as there is no expectation that themes create classes that set border colors.
			} else if ( mainColor ) {
				const colors = get( select( 'core/block-editor' ).getSettings(), [ 'colors' ], [] );
				const colorObject = getColorObjectByAttributeValues( colors, mainColor );
				figureStyles = {
					borderColor: colorObject.color,
				};
			}

			const blockquoteTextColorClass = getColorClassName( 'color', textColor );
			const blockquoteClasses = ( textColor || customTextColor ) && classnames( 'has-text-color', {
				[ blockquoteTextColorClass ]: blockquoteTextColorClass,
			} );

			const blockquoteStyles = blockquoteTextColorClass ? undefined : { color: customTextColor };

			return (
				<figure className={ figureClasses } style={ figureStyles }>
					<blockquote className={ blockquoteClasses } style={ blockquoteStyles } >
						<RichText.Content value={ value } multiline />
						{ ! RichText.isEmpty( citation ) && <RichText.Content tagName="cite" value={ citation } /> }
					</blockquote>
				</figure>
			);
		},
	},
	{
		attributes: blockAttributes,
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
				const colors = get( select( 'core/block-editor' ).getSettings(), [ 'colors' ], [] );
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
						<RichText.Content value={ value } multiline />
						{ ! RichText.isEmpty( citation ) && <RichText.Content tagName="cite" value={ citation } /> }
					</blockquote>
				</figure>
			);
		},
	},
	{
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
				type: 'string',
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
	},
];

export default deprecated;
