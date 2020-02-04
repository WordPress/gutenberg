/**
 * WordPress dependencies
 */
import {
	cloneElement,
	createElement,
	Component,
	isValidElement,
} from '@wordpress/element';
import { SVG } from '@wordpress/primitives';

/**
 * Internal dependencies
 */
import Dashicon from '../dashicon';

function Icon( { icon = null, size, ...additionalProps } ) {
	// Dashicons should be 20x20 by default.
	const dashiconSize = size || 20;

	if ( 'string' === typeof icon ) {
		return (
			<Dashicon
				icon={ icon }
				size={ dashiconSize }
				{ ...additionalProps }
			/>
		);
	}

	if ( icon && Dashicon === icon.type ) {
		return cloneElement( icon, {
			size: dashiconSize,
			...additionalProps,
		} );
	}

	// Icons should be 24x24 by default.
	const iconSize = size || 24;
	if ( 'function' === typeof icon ) {
		if ( icon.prototype instanceof Component ) {
			return createElement( icon, {
				size: iconSize,
				...additionalProps,
			} );
		}

		return icon( { size: iconSize, ...additionalProps } );
	}

	if ( icon && ( icon.type === 'svg' || icon.type === SVG ) ) {
		const appliedProps = {
			width: iconSize,
			height: iconSize,
			...icon.props,
			...additionalProps,
		};

		return <SVG { ...appliedProps } />;
	}

	if ( isValidElement( icon ) ) {
		return cloneElement( icon, {
			size: iconSize,
			...additionalProps,
		} );
	}

	return icon;
}

export default Icon;
