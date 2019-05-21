/**
 * WordPress dependencies
 */
import { cloneElement, createElement, Component, isValidElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Dashicon, SVG } from '../';

function Icon( { icon = null, size, className } ) {
	let iconSize;

	if ( 'string' === typeof icon ) {
		// Dashicons should be 20x20 by default
		iconSize = size || 20;
		return <Dashicon icon={ icon } size={ iconSize } className={ className } />;
	}

	// Any other icons should be 24x24 by default
	iconSize = size || 24;

	if ( 'function' === typeof icon ) {
		if ( icon.prototype instanceof Component ) {
			return createElement( icon, { className, size: iconSize } );
		}

		return icon();
	}

	if ( icon && ( icon.type === 'svg' || icon.type === SVG ) ) {
		const appliedProps = {
			className,
			width: iconSize,
			height: iconSize,
			...icon.props,
		};

		return <SVG { ...appliedProps } />;
	}

	if ( isValidElement( icon ) ) {
		return cloneElement( icon, {
			className,
			size: iconSize,
		} );
	}

	return icon;
}

export default Icon;
