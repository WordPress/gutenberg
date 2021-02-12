/**
 * External dependencies
 */
import { contextConnect, useContextSystem } from '@wp-g2/context';
import { css, cx } from '@wp-g2/styles';

/**
 * WordPress dependencies
 */
import { useMemo, cloneElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { View } from '../view';
import * as styles from './styles';

/* eslint-disable jsdoc/valid-types */
/**
 * @typedef Props
 * @property {import('react').CSSProperties['fill']} [fill='currentColor'] Icon fill.
 * @property {number} [height] Icon height.
 * @property {import('react').ReactElement} icon Icon to render.
 * @property {boolean} [inline] Whether the icon is inline with text.
 * @property {number | string} [size=20] Icon size.
 * @property {keyof styles} [variant] Variant to render.
 * @property {number} [width] Icon width.
 * @property {never} [children] Children are disallowed.
 */
/* eslint-enable jsdoc/valid-types */

/**
 * @param {import('@wp-g2/create-styles').ViewOwnProps<Props, 'div'>} props
 * @param {import('react').Ref<any>} forwardedRef
 */
function Icon( props, forwardedRef ) {
	const {
		className,
		fill = 'currentColor', // https://github.com/ItsJonQ/g2/pull/133#discussion_r525538497
		height,
		icon,
		inline,
		size = 20,
		variant,
		width,
		...otherProps
	} = useContextSystem( props, 'Icon' );

	const classes = useMemo( () => {
		const sx = {};

		// https://github.com/ItsJonQ/g2/issues/136
		sx.fill = css( {
			color: fill,
			fill: 'currentColor',
		} );

		sx.size = css( {
			height: height || size,
			width: width || size,
		} );

		return cx(
			styles.Wrapper,
			sx.fill,
			sx.size,
			inline && styles.inline,
			variant && styles[ variant ],
			className
		);
	}, [ className, fill, height, inline, size, variant, width ] );

	if ( ! icon ) return null;

	const IconComponent = cloneElement( icon, {
		height: size,
		ref: forwardedRef,
		size,
		width: size,
	} );

	return (
		<View { ...otherProps } className={ classes }>
			{ IconComponent }
		</View>
	);
}

export default contextConnect( Icon, 'Icon' );
