/**
 * WordPress dependencies
 */
import { cloneElement, createElement, Component, isValidElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Dashicon, SVG } from '../';

function Icon( { icon = null, size, className, ...additionalProps } ) {
	let iconSize;

	if ( 'string' === typeof icon ) {
		// Dashicons should be 20x20 by default
		iconSize = size || 20;
		return <Dashicon icon={ icon } size={ iconSize } className={ className } { ...additionalProps } />;
	}

	// Any other icons should be 24x24 by default
	iconSize = size || 24;

	if ( 'function' === typeof icon ) {
		if ( icon.prototype instanceof Component ) {
			return createElement( icon, { className, ...additionalProps, size: iconSize } );
		}

		return icon( { className, ...additionalProps, size: iconSize } );
	}

	if ( icon && ( icon.type === 'svg' || icon.type === SVG ) ) {
		const appliedProps = {
			className,
			width: iconSize,
			height: iconSize,
			...icon.props,
			...additionalProps,
		};

		return <SVG { ...appliedProps } />;
	}

	if ( isValidElement( icon ) ) {
		return cloneElement( icon, {
			className,
			...additionalProps,
			size: iconSize,
		} );
	}

	return icon;
}

export default Icon;
