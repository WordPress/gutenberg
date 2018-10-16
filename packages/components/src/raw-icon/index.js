/**
 * WordPress dependencies
 */
import { cloneElement, createElement, Component, isValidElement } from '@wordpress/element';
import { Dashicon, SVG } from '../';

function RawIcon( { icon = null, size = 24, className } ) {
	if ( 'string' === typeof icon ) {
		return <Dashicon icon={ icon } size={ size } className={ className } />;
	}

	if ( 'function' === typeof icon ) {
		if ( icon.prototype instanceof Component ) {
			return createElement( icon, { className, size } );
		}

		return icon();
	}

	if ( icon && ( icon.type === 'svg' || icon.type === SVG ) ) {
		const appliedProps = {
			className,
			width: size,
			height: size,
			...icon.props,
		};

		return <SVG { ...appliedProps } />;
	}

	if ( isValidElement( icon ) ) {
		return cloneElement( icon, {
			className,
			size,
		} );
	}

	return icon;
}

export default RawIcon;
