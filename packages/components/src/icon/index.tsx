/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { ComponentType, HTMLProps, SVGProps } from 'react';

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
import type { Icon as DashiconIcon } from '../dashicon/types';

type IconType< P > = DashiconIcon | ComponentType< P > | JSX.Element;

interface BaseProps< P > {
	/**
	 * The icon to render. Supported values are: Dashicons (specified as
	 * strings), functions, WPComponent instances and `null`.
	 *
	 * @default null
	 */
	icon?: IconType< P >;
	/**
	 * The size (width and height) of the icon.
	 *
	 * @default `20` (when using Dashicon), `24` otherwise
	 */
	size?: number;
}

type AdditionalProps< T > = T extends ComponentType< infer U >
	? U
	: T extends DashiconIcon
	? SVGProps< SVGSVGElement >
	: {};

export type Props< P > = BaseProps< P > & AdditionalProps< IconType< P > >;

function Icon< P >( { icon, size, ...additionalProps }: Props< P > ) {
	if ( 'string' === typeof icon ) {
		return (
			<Dashicon
				icon={ icon }
				{ ...( additionalProps as HTMLProps< HTMLSpanElement > ) }
			/>
		);
	}

	if ( isValidElement( icon ) && Dashicon === icon.type ) {
		return cloneElement( icon, {
			...additionalProps,
		} );
	}

	// Icons should be 24x24 by default.
	const iconSize = size || 24;
	if ( 'function' === typeof icon ) {
		if ( icon.prototype instanceof Component ) {
			return createElement( icon, ( {
				size: iconSize,
				...additionalProps,
			} as unknown ) as P );
		}

		return ( icon as ( ...args: any[] ) => JSX.Element )( {
			size: iconSize,
			...additionalProps,
		} );
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
			// @ts-ignore Just forwarding the size prop along
			size: iconSize,
			...additionalProps,
		} );
	}

	return icon;
}

export default Icon;
