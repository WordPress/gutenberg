/**
 * WordPress dependencies
 */
import { cloneElement, createElement, Component, isValidElement } from '@wordpress/element';
import { Dashicon, SVG } from '../';

function RawIcon( { icon = null, size = 24, className } ) {
	if ( 'string' === typeof icon ) {
		return <Dashicon icon={ icon } size={ size } className={ className } />;
	} else if ( 'function' === typeof icon ) {
		if ( icon.prototype instanceof Component ) {
			return createElement( icon, { className, size } );
		}

		return icon();
	} else if ( icon && icon.type === 'svg' ) {
		const appliedProps = {
			...icon.props,
			className,
			width: icon.props.width || size,
			height: icon.props.height || size,
		};

		return <SVG { ...appliedProps } />;
	} else if ( isValidElement( icon ) ) {
		return cloneElement( icon, {
			className,
			size,
		} );
	}

	return icon || null;
}

export default RawIcon;
