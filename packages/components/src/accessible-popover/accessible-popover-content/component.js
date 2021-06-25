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
import { useAccessiblePopoverContext } from '../context';
import * as styles from '../styles';
import { contextConnect } from '../../ui/context';
import { useAccessiblePopoverContent } from './hook';

/**
 *
 * @param {import('../../ui/context').PolymorphicComponentProps<import('../types').ContentProps, 'div'>} props
 * @param {import('react').Ref<any>}                                                                     forwardedRef
 */
function AccessiblePopoverContent( props, forwardedRef ) {
	const {
		children,
		elevation,
		classes,
		...otherProps
	} = useAccessiblePopoverContent( props );

	const { label, popover } = useAccessiblePopoverContext();

	if ( ! popover ) {
		throw new Error(
			'`AccessiblePopoverContent` must only be used inside a `AccessiblePopover`.'
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

const ConnectedAccessiblePopoverContent = contextConnect(
	AccessiblePopoverContent,
	'AccessiblePopoverContent'
);

export default ConnectedAccessiblePopoverContent;
