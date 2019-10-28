/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { createElement, forwardRef, useContext } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { ToolbarContext } from '../toolbar';
import ToolbarButton from './toolbar-button';

export function Button( props, ref ) {
	const {
		href,
		target,
		isPrimary,
		isLarge,
		isSmall,
		isTertiary,
		isToggled,
		isBusy,
		isDefault,
		isLink,
		isDestructive,
		className,
		disabled,
		...additionalProps
	} = props;

	const classes = classnames( 'components-button', className, {
		'is-button': isDefault || isPrimary || isLarge || isSmall,
		'is-default': isDefault || ( ! isPrimary && ( isLarge || isSmall ) ),
		'is-primary': isPrimary,
		'is-large': isLarge,
		'is-small': isSmall,
		'is-tertiary': isTertiary,
		'is-toggled': isToggled,
		'is-busy': isBusy,
		'is-link': isLink,
		'is-destructive': isDestructive,
	} );

	const tag = href !== undefined && ! disabled ? 'a' : 'button';
	const tagProps = tag === 'a' ? { href, target } : { type: 'button', disabled };
	const allProps = { ...tagProps, ...additionalProps, className: classes, ref };

	const toolbarContext = useContext( ToolbarContext );

	// If it's within a toolbar, render with toolbar context instead.
	if ( toolbarContext ) {
		return <ToolbarButton context={ toolbarContext } as={ tag } { ...allProps } />;
	}

	return createElement( tag, allProps );
}

export default forwardRef( Button );
