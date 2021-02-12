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
import { withNext } from '../ui/context';
import { Icon as NextIcon } from '../ui/icon';
import Dashicon from '../dashicon';

const Icon = process.env.COMPONENT_SYSTEM_PHASE === 1 ? NextIcon : undefined;

const getRenderedIcon = ( { icon = null, size, ...additionalProps } ) => {
	if ( 'string' === typeof icon ) {
		return <Dashicon icon={ icon } { ...additionalProps } />;
	}

	if ( icon && Dashicon === icon.type ) {
		return cloneElement( icon, {
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
};

const adapter = ( { icon, size, ...additionalProps } ) => ( {
	...additionalProps,
	size,
	icon: getRenderedIcon( { icon, size, ...additionalProps } ),
} );

export function withNextComponent( Current ) {
	return withNext( Current, Icon, 'WPComponentsIcon', adapter );
}
