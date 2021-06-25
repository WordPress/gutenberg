/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import { Popover as ReakitPopover } from 'reakit';

/**
 * Internal dependencies
 */
import { Card } from '../../card';
import { View } from '../../view';
import { useFlyoutContext } from '../context';
import * as styles from '../styles';
import { contextConnect } from '../../ui/context';
import { useFlyoutContent } from './hook';

/**
 *
 * @param {import('../../ui/context').PolymorphicComponentProps<import('../types').ContentProps, 'div'>} props
 * @param {import('react').Ref<any>}                                                                     forwardedRef
 */
function FlyoutContent( props, forwardedRef ) {
	const { children, elevation, classes, ...otherProps } = useFlyoutContent(
		props
	);

	const { label, popover } = useFlyoutContext();

	if ( ! popover ) {
		throw new Error(
			'`FlyoutContent` must only be used inside a `Flyout`.'
		);
	}

	const showContent = popover.visible || popover.animating;

	return (
		<ReakitPopover
			aria-label={ label }
			as={ View }
			className={ classes }
			{ ...otherProps }
			{ ...popover }
		>
			{ showContent && (
				<Card
					className={ styles.cardStyle }
					elevation={ elevation }
					ref={ forwardedRef }
				>
					{ children }
				</Card>
			) }
		</ReakitPopover>
	);
}

const ConnectedFlyoutContent = contextConnect( FlyoutContent, 'FlyoutContent' );

export default ConnectedFlyoutContent;
