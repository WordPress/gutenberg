/**
 * Internal dependencies
 */
import { withNext } from '../ui/context';
import { TooltipButton as NextButton } from '../ui/tooltip-button';

const Button =
	process.env.COMPONENT_SYSTEM_PHASE === 1 ? NextButton : undefined;

const getVariant = ( {
	isPrimary,
	isTertiary,
	isSecondary,
	isLink,
	isDefault,
} ) => {
	if ( isPrimary ) {
		return 'primary';
	}

	if ( isTertiary ) {
		return 'tertiary';
	}

	if ( isSecondary ) {
		return 'secondary';
	}

	if ( isDefault ) {
		return 'plain';
	}

	if ( isLink ) {
		return 'link';
	}

	return 'plain';
};

const adapter = ( {
	isPrimary,
	isTertiary,
	isSecondary,
	isLink,
	isDefault,
	isSmall,
	isBusy,
	label,
	'aria-label': ariaLabel,
	describedBy,
	shortcut,
	tooltipPosition,
	text,
	...props
} ) => ( {
	...props,
	describedBy,
	variant: getVariant( {
		isPrimary,
		isTertiary,
		isSecondary,
		isLink,
		isDefault,
	} ),
	isActive: isBusy,
	isLoading: isBusy,
	size: isSmall ? 'small' : undefined,
	'aria-label': ariaLabel || label,
	pre: text,
	tooltip: {
		content: describedBy ? describedBy : ariaLabel || label,
		position: tooltipPosition,
		shortcut,
	},
} );

export function withNextComponent( Component ) {
	return withNext( Component, Button, 'WPComponentsButton', adapter );
}
