/**
 * External dependencies
 */
import classnames from 'classnames';
import { includes } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	getColorClassName,
	RichText,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { SOLID_COLOR_CLASS } from './shared';

export default function save( { attributes } ) {
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
}
