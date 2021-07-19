/**
 * External dependencies
 */
import classnames from 'classnames';
import { capitalize } from 'lodash';

/**
 * WordPress dependencies
 */
import { getColorClassName } from '@wordpress/block-editor';

/**
 * Determines CSS classnames and styles for supplied background and text color
 * pairing. This is intended for use with the Table block's secondary, header
 * and footer color pairs.
 *
 * @param  {string} name  Base name for the table color set.
 * @param  {Object} props Table block props.
 *
 * @return {Object} CSS class and style props for specified table color set.
 */
export function getColorPropsFromObjects( name, props ) {
	const backgroundColor = props[ `${ name }BackgroundColor` ];
	const textColor = props[ `${ name }TextColor` ];

	return {
		className: classnames( backgroundColor?.class, textColor?.class, {
			'has-background': !! backgroundColor?.color,
			'has-text-color': !! textColor?.color,
		} ),
		style: {
			backgroundColor: ! backgroundColor?.class && backgroundColor?.color,
			color: ! textColor?.class && textColor?.color,
		},
	};
}

/**
 * Builds object containing classname and style prop values for a specified
 * table color set (secondary, header and footer). It is intended to be used
 * within the table block's save function.
 *
 * @param  {string} name       Base name for table color set.
 * @param  {Object} attributes Table block attributes.
 *
 * @return {Object} CSS class and style props for supplied colors.
 */
export function getColorProps( name, attributes ) {
	const capitalizedName = capitalize( name );

	// Background class and color.
	const backgroundClass = getColorClassName(
		'background-color',
		attributes[ `${ name }BackgroundColor` ]
	);
	const customBackgroundColor =
		attributes[ `custom${ capitalizedName }BackgroundColor` ];

	// Text class and color.
	const textClass = getColorClassName(
		'color',
		attributes[ `${ name }TextColor` ]
	);
	const customTextColor = attributes[ `custom${ capitalizedName }TextColor` ];

	return {
		className: classnames( {
			'has-background': backgroundClass || customBackgroundColor,
			'has-text-color': textClass || customTextColor,
			[ backgroundClass ]: backgroundClass,
			[ textClass ]: textClass,
		} ),
		style: {
			backgroundColor: backgroundClass
				? undefined
				: customBackgroundColor,
			color: textClass ? undefined : customTextColor,
		},
	};
}
