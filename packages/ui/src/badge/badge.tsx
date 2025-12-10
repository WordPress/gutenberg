/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Box } from '../box';
import { type BoxProps } from '../box/types';
import { type BadgeProps } from './types';

/**
 * Default render function that renders a span element with the given props.
 *
 * @param props The props to apply to the HTML element.
 */
const DEFAULT_RENDER = ( props: React.ComponentPropsWithoutRef< 'span' > ) => (
	<span { ...props } />
);

/**
 * Maps intent values to Box backgroundColor and color props.
 * Uses strong emphasis styles (as emphasis prop has been removed).
 * @param intent
 */
const getIntentStyles = (
	intent: BadgeProps[ 'intent' ]
): Pick<
	BoxProps,
	'backgroundColor' | 'color' | 'borderColor' | 'borderWidth'
> => {
	switch ( intent ) {
		case 'high':
			return {
				backgroundColor: 'error' as const,
				color: 'error' as const,
			};
		case 'medium':
			return {
				backgroundColor: 'warning' as const,
				color: 'warning' as const,
			};
		case 'low':
			return {
				backgroundColor: 'caution' as const,
				color: 'caution' as const,
			};
		case 'stable':
			return {
				backgroundColor: 'success' as const,
				color: 'success' as const,
			};
		case 'informational':
			return {
				backgroundColor: 'info' as const,
				color: 'info' as const,
			};
		case 'draft':
			return {
				backgroundColor: 'neutral-weak' as const,
				color: 'neutral' as const,
			};
		case 'none':
		default:
			return {
				backgroundColor: 'neutral-strong' as const,
				color: 'neutral' as const,
				borderColor: 'neutral' as const,
				borderWidth: 'xs' as const,
			};
	}
};

/**
 * A badge component for displaying labels with semantic intent.
 * Built on the Box primitive for consistent theming and accessibility.
 */
export const Badge = forwardRef< HTMLSpanElement, BadgeProps >( function Badge(
	{ children, intent = 'none', render = DEFAULT_RENDER, ...props },
	ref
) {
	const intentStyles = getIntentStyles( intent );
	const boxProps = {
		...props,
		...intentStyles,
		padding: { inline: 'xs' } as const,
		borderRadius: 'lg' as const,
		render,
		style: {
			display: 'inline-flex',
			alignItems: 'center',
			minHeight: 'calc(6 * var(--wpds-dimension-base))',
			fontFamily: 'var(--wpds-font-family-body)',
			fontSize: 'var(--wpds-font-size-small)',
			fontWeight: 'var(--wpds-font-weight-regular)',
			lineHeight: 'var(--wpds-font-line-height-small)',
			boxSizing: 'border-box',
			...props.style,
		},
	} as BoxProps;

	return (
		<Box
			{ ...boxProps }
			ref={ ref as React.ForwardedRef< HTMLDivElement > }
		>
			{ children }
		</Box>
	);
} );
