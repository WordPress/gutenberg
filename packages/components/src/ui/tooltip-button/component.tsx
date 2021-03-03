/**
 * External dependencies
 */
import type { ViewOwnProps } from '@wp-g2/create-styles';
// eslint-disable-next-line no-restricted-imports
import type { Ref } from 'react';
import { useContextSystem, contextConnect } from '@wp-g2/context';

/**
 * Internal dependencies
 */
import type { Props as ButtonProps } from '../button/component';
import type { Props as TooltipProps } from '../tooltip/types';
import { Button } from '../button';
import { Tooltip } from '../tooltip';

export interface TooltipButtonProps extends ButtonProps {
	tooltip?: TooltipProps;
}

function TooltipButton(
	props: ViewOwnProps< TooltipButtonProps, 'button' >,
	forwardedRef: Ref< any >
): JSX.Element {
	const { tooltip, ...buttonProps } = useContextSystem(
		props,
		'TooltipButton'
	);

	if ( ! tooltip ) {
		return <Button { ...buttonProps } ref={ forwardedRef } />;
	}

	return (
		<Tooltip { ...tooltip }>
			<Button { ...buttonProps } ref={ forwardedRef } />
		</Tooltip>
	);
}

/**
 * `TooltipButton` is a simple component that composes `Button` with a `Tooltip`.
 * It mostly exists as an adaptive layer between the `Button` it uses and the original `Button`.
 *
 * ```jsx
 * import { TooltipButton } from `@wordpress/components/ui`;
 *
 * function Example() {
 * 	return (
 * 		<TooltipButton
 * 			variant="secondary"
 * 			tooltip={ { content: 'WordPress.org' } }
 * 		>
 * 			Code is Poetry
 * 		</TooltipButton>
 * 	);
 * }
 * ```
 */
export default contextConnect( TooltipButton, 'TooltipButton' );
