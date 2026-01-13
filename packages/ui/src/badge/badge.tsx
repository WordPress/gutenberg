import { forwardRef } from '@wordpress/element';
import { Box } from '../box';
import { type BoxProps } from '../box/types';
import { type BadgeProps } from './types';

/**
 * Default render function that renders a span element with the given props.
 */
const DEFAULT_RENDER = ( props: React.ComponentPropsWithoutRef< 'span' > ) => (
	<span { ...props } />
);

/**
 * Maps intent values to Box backgroundColor and color props.
 * Uses strong emphasis styles (as emphasis prop has been removed).
 */
const getIntentStyles = (
	intent: BadgeProps[ 'intent' ]
): Partial< BoxProps > => {
	switch ( intent ) {
		case 'high':
			return {
				backgroundColor: 'error',
				color: 'error',
			};
		case 'medium':
			return {
				backgroundColor: 'warning',
				color: 'warning',
			};
		case 'low':
			return {
				backgroundColor: 'caution',
				color: 'caution',
			};
		case 'stable':
			return {
				backgroundColor: 'success',
				color: 'success',
			};
		case 'informational':
			return {
				backgroundColor: 'info',
				color: 'info',
			};
		case 'draft':
			return {
				backgroundColor: 'neutral-weak',
				color: 'neutral',
			};
		case 'none':
		default:
			return {
				backgroundColor: 'neutral',
				color: 'neutral-weak',
			};
	}
};

/**
 * A badge component for displaying labels with semantic intent.
 * Built on the Box primitive for consistent theming and accessibility.
 */
export const Badge = forwardRef< HTMLDivElement, BadgeProps >( function Badge(
	{ children, intent = 'none', render = DEFAULT_RENDER, ...props },
	ref
) {
	const intentStyles = getIntentStyles( intent );

	return (
		<Box
			{ ...intentStyles }
			padding={ { inline: 'xs', block: '2xs' } }
			borderRadius="lg"
			render={ render }
			style={ {
				fontFamily: 'var(--wpds-font-family-body)',
				fontSize: 'var(--wpds-font-size-sm)',
				fontWeight: 'var(--wpds-font-weight-regular)',
				lineHeight: 'var(--wpds-font-line-height-xs)',
				...props.style,
			} }
			ref={ ref }
		>
			{ children }
		</Box>
	);
} );
