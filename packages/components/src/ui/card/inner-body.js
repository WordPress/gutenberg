/**
 * External dependencies
 */
import { contextConnect, useContextSystem } from '@wp-g2/context';
import { cx } from '@wp-g2/styles';

/**
 * Internal dependencies
 */
import { View } from '../view';
import * as styles from './styles';

/**
 * @param {import('@wp-g2/create-styles').ViewOwnProps<{}, 'div'>} props
 * @param {import('react').Ref<any>} forwardedRef
 */
function CardInnerBody( props, forwardedRef ) {
	const { className, ...otherProps } = useContextSystem(
		props,
		'CardInnerBody'
	);

	const classes = cx( styles.InnerBody, className );

	return (
		<View { ...otherProps } className={ classes } ref={ forwardedRef } />
	);
}

export default contextConnect( CardInnerBody, 'CardInnerBody' );
