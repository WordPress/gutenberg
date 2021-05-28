/**
 * External dependencies
 */
import { cx } from 'emotion';

/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { contextConnect, useContextSystem } from '../context';
import { Flex } from '../../flex';
import * as styles from './styles';

/**
 * @param {import('../context').PolymorphicComponentProps<import('./types').CardFooterProps, 'div'>} props
 * @param {import('react').Ref<any>} forwardedRef
 */
function CardFooter( props, forwardedRef ) {
	const {
		className,
		justify = 'flex-end',
		size = 'medium',
		...otherProps
	} = useContextSystem( props, 'CardFooter' );

	const classes = useMemo(
		() =>
			cx(
				styles.borderRadius,
				styles.headerFooter,
				styles[ size ],
				className
			),
		[ className, size ]
	);

	return (
		<Flex
			{ ...otherProps }
			className={ classes }
			justify={ justify }
			ref={ forwardedRef }
		/>
	);
}

/**
 * `CardFooter` is a layout component, rendering the footer content of a `Card`.
 *
 * @example
 * ```jsx
 * import { Card, CardBody, CardFooter } from `@wordpress/components/ui`;
 *
 * <Card>
 * 	<CardBody>...</CardBody>
 * 	<CardFooter>...</CardFooter>
 * </Card>
 * ```
 */
const ConnectedCardFooter = contextConnect( CardFooter, 'CardFooter' );

export default ConnectedCardFooter;
