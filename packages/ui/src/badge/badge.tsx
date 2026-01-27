import { useRender, mergeProps } from '@base-ui/react';
import { forwardRef } from '@wordpress/element';
import { type BadgeProps } from './types';

/**
 * Default render function that renders a span element with the given props.
 */
const DEFAULT_RENDER = ( props: React.ComponentPropsWithoutRef< 'span' > ) => (
	<span { ...props } />
);

/**
 * Maps intent values to CSS styles using design tokens.
 */
const getIntentStyles = (
	intent: BadgeProps[ 'intent' ]
): React.CSSProperties => {
	switch ( intent ) {
		case 'high':
			return {
				backgroundColor: 'var(--wpds-color-bg-surface-error)',
				color: 'var(--wpds-color-fg-content-error)',
			};
		case 'medium':
			return {
				backgroundColor: 'var(--wpds-color-bg-surface-warning)',
				color: 'var(--wpds-color-fg-content-warning)',
			};
		case 'low':
			return {
				backgroundColor: 'var(--wpds-color-bg-surface-caution)',
				color: 'var(--wpds-color-fg-content-caution)',
			};
		case 'stable':
			return {
				backgroundColor: 'var(--wpds-color-bg-surface-success)',
				color: 'var(--wpds-color-fg-content-success)',
			};
		case 'informational':
			return {
				backgroundColor: 'var(--wpds-color-bg-surface-info)',
				color: 'var(--wpds-color-fg-content-info)',
			};
		case 'draft':
			return {
				backgroundColor: 'var(--wpds-color-bg-surface-neutral-weak)',
				color: 'var(--wpds-color-fg-content-neutral)',
			};
		case 'none':
		default:
			return {
				backgroundColor: 'var(--wpds-color-bg-surface-neutral)',
				color: 'var(--wpds-color-fg-content-neutral-weak)',
			};
	}
};

/**
 * A badge component for displaying labels with semantic intent.
 */
export const Badge = forwardRef< HTMLSpanElement, BadgeProps >( function Badge(
	{ children, intent = 'none', render = DEFAULT_RENDER, ...props },
	ref
) {
	const intentStyles = getIntentStyles( intent );

	const style: React.CSSProperties = {
		...intentStyles,
		paddingInline: 'var(--wpds-dimension-padding-sm)',
		paddingBlock: 'var(--wpds-dimension-padding-xs)',
		borderRadius: 'var(--wpds-border-radius-lg)',
		fontFamily: 'var(--wpds-font-family-body)',
		fontSize: 'var(--wpds-font-size-sm)',
		fontWeight: 'var(--wpds-font-weight-regular)',
		lineHeight: 'var(--wpds-font-line-height-xs)',
		...props.style,
	};

	const element = useRender( {
		render,
		ref,
		props: mergeProps< 'span' >( props, { style, children } ),
	} );

	return element;
} );
