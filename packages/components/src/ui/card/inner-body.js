/**
 * External dependencies
 */
import { cx } from 'emotion';

/**
 * Internal dependencies
 */
import { View } from '../../view';
import { contextConnect, useContextSystem } from '../context';
import * as styles from './styles';

/**
 * @param {import('../context').PolymorphicComponentProps<{}, 'div'>} props
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
