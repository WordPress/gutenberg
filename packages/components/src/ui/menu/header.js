/**
 * External dependencies
 */
import { contextConnect, useContextSystem } from '@wp-g2/context';
import { cx } from '@wp-g2/styles';
import { pick } from 'lodash';

/**
 * Internal dependencies
 */
import * as baseButtonStyles from '../base-button/styles';
import { Heading } from '../heading';
import * as styles from './styles';

const sizeStyles = pick( baseButtonStyles, [ 'large', 'small', 'xSmall' ] );

/**
 * @typedef OwnProps
 * @property {keyof sizeStyles} size Size of the menu header.
 */

/**
 * @typedef {import('../heading').HeadingProps & OwnProps} Props
 */

/**
 *
 * @param {import('@wp-g2/create-styles').ViewOwnProps<Props, 'div'>} props
 * @param {import('react').Ref<any>} forwardedRef
 */
function MenuHeader( props, forwardedRef ) {
	const {
		children,
		className,
		size,
		level = 5,
		...otherProps
	} = useContextSystem( props, 'MenuHeader' );

	const classes = cx( styles.MenuHeader, sizeStyles[ size ], className );

	return (
		<Heading
			level={ level }
			{ ...otherProps }
			className={ classes }
			ref={ forwardedRef }
		>
			{ children }
		</Heading>
	);
}

export default contextConnect( MenuHeader, 'MenuHeader' );
