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
 * @param {import('../context').PolymorphicComponentProps<import('./types').CardHeaderProps, 'div'>} props
 * @param {import('react').Ref<any>} forwardedRef
 */
function CardHeader( props, forwardedRef ) {
	const { className, size = 'medium', ...otherProps } = useContextSystem(
		props,
		'CardHeader'
	);

	const classes = useMemo(
		() =>
			cx(
				styles.Header,
				styles.borderRadius,
				styles.headerFooter,
				styles[ size ],
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
