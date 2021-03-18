/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';
/**
 * Internal dependencies
 */
import Dashicon from '../dashicon';

const getVariant = ( {
	variant,
	isPrimary,
	isTertiary,
	isSecondary,
	isLink,
	isDefault,
} ) => {
	if ( typeof variant !== 'undefined' ) {
		return variant;
	}

	if ( isPrimary ) {
		deprecated( 'Button isPrimary', {
			alternative: 'variant="primary"',
		} );
		return 'primary';
	}

	if ( isTertiary ) {
		deprecated( 'Button isTertiary', {
			alternative: 'variant="tertiary"',
		} );
		return 'tertiary';
	}

	if ( isSecondary ) {
		deprecated( 'Button isSecondary', {
			alternative: 'variant="secondary"',
		} );
		return 'secondary';
	}

	if ( isDefault ) {
		deprecated( 'Button isDefault', { alternative: 'variant="plain"' } );
		return 'plain';
	}

	if ( isLink ) {
		deprecated( 'Button isLink', { alternative: 'variant="link"' } );
		return 'link';
	}

	return 'plain';
};

function getTooltip( {
	tooltip,
	describedBy,
	ariaLabel,
	label,
	tooltipPosition,
	shortcut,
} ) {
	if ( typeof tooltip !== 'undefined' ) {
		return tooltip;
	}

	tooltip = {};

	if ( tooltipPosition ) {
		deprecated( 'Button tooltipPosition', {
			alternative: 'tooltip={{ position: tooltipPosition }}',
		} );
		tooltip.position = tooltipPosition;
	}

	if ( shortcut ) {
		deprecated( 'Button shortcut', {
			alternative: 'tooltip={{ shortcut }}',
		} );
		tooltip.shortcut = shortcut;
	}

	if ( Object.keys( tooltip ).length !== 0 ) {
		// if there is indeed deprecated tooltip props being passed in
		deprecated( 'Button implicit tooltip content', {
			alternative: 'tooltip={{ content }}',
		} );
		tooltip.content = describedBy ? describedBy : ariaLabel || label;
	}

	return tooltip;
}

function getPre( { pre, text } ) {
	if ( typeof text !== 'undefined' ) {
		deprecated( 'Button text', { alternative: 'pre={ text }' } );
		return text;
	}
	return pre;
}

function getAriaLabel( { ariaLabel, label } ) {
	if ( typeof label !== 'undefined' ) {
		deprecated( 'Button label', { alternative: 'aria-label={ label }' } );
		return label;
	}
	return ariaLabel;
}

function getSize( { isSmall, size } ) {
	if ( typeof isSmall !== 'undefined' ) {
		deprecated( 'Button isSmall', { alternative: 'Button size' } );
		return isSmall ? 'small' : undefined;
	}
	return size;
}

function getIsActive( { isBusy, isActive } ) {
	if ( typeof isBusy !== 'undefined' ) {
		deprecated( 'Button isBusy', { alternative: 'Button isActive' } );
		return isBusy;
	}
	return isActive;
}

function getIsLoading( { isBusy, isLoading } ) {
	if ( typeof isBusy !== 'undefined' ) {
		deprecated( 'Button isBusy', { alternative: 'Button isLoading' } );
		return isBusy;
	}
	return isLoading;
}

function getIcon( { icon } ) {
	if ( typeof icon === 'string' ) {
		deprecated( 'Button icon as string', {
			alternative: 'Button icon as ReactElement',
			hint: 'Use the icons from @wordpress/icons',
		} );
		return <Dashicon icon={ icon } />;
	}
	return icon;
}

export function useDeprecatedButtonProps( {
	variant,
	isPrimary,
	isTertiary,
	isSecondary,
	isLink,
	isDefault,
	isSmall,
	isBusy,
	isLoading,
	isActive,
	label,
	'aria-label': ariaLabel,
	describedBy,
	shortcut,
	tooltipPosition,
	tooltip,
	text,
	pre,
	size,
	icon,
	...props
} ) {
	return {
		...props,
		describedBy,
		icon: getIcon( { icon } ),
		variant: getVariant( {
			variant,
			isPrimary,
			isTertiary,
			isSecondary,
			isLink,
			isDefault,
		} ),
		isActive: getIsActive( { isActive, isBusy } ),
		isLoading: getIsLoading( { isLoading, isBusy } ),
		size: getSize( { size, isSmall } ),
		'aria-label': getAriaLabel( { ariaLabel, label } ),
		pre: getPre( { pre, text } ),
		tooltip: getTooltip( {
			tooltip,
			describedBy,
			ariaLabel,
			tooltipPosition,
			shortcut,
			label,
		} ),
	};
}
