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
import { contextConnect, useContextSystem } from '../ui/context';
import { Flex } from '../flex';
import * as styles from './styles';

/**
 * @param {import('../ui/context').PolymorphicComponentProps<import('./types').CardFooterProps, 'div'>} props
 * @param {import('react').Ref<any>} forwardedRef
 */
function CardFooter( props, forwardedRef ) {
	const {
		className,
		justify = 'flex-end',
		isShady = false,
		size = 'medium',
		...otherProps
	} = useContextSystem( props, 'CardFooter' );

	const classes = useMemo(
		() =>
			cx(
				styles.borderRadius,
				styles.headerFooter,
				styles.cardPaddings[ size ],
				isShady ? styles.shady : undefined,
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
