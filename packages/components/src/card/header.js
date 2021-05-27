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
 * @param {import('../ui/context').PolymorphicComponentProps<import('./types').CardHeaderProps, 'div'>} props
 * @param {import('react').Ref<any>} forwardedRef
 */
function CardHeader( props, forwardedRef ) {
	const {
		className,
		minHeight = 'medium',
		isShady = false,
		size = 'medium',
		...otherProps
	} = useContextSystem( props, 'CardHeader' );

	const classes = useMemo(
		() =>
			cx(
				styles.Header,
				styles.borderRadius,
				styles.headerFooter,
				styles.cardPaddings[ size ],
				styles.minHeights[ minHeight ],
				isShady && styles.shady,
				className
			),
		[ className, size ]
	);

	return (
		<Flex { ...otherProps } className={ classes } ref={ forwardedRef } />
	);
}

/**
 * `CardHeader` is a layout component, rendering the header contents of a `Card`.
 *
 * @example
 * ```jsx
 * import { Card, CardBody, CardHeader } from `@wordpress/components/ui`;
 *
 * <Card>
 * 	<CardHeader>...</CardHeader>
 * 	<CardBody>...</CardBody>
 * </Card>
 * ```
 */
const ConnectedCardHeader = contextConnect( CardHeader, 'CardHeader' );

export default ConnectedCardHeader;
