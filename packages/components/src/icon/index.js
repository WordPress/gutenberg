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

/* eslint-disable jsdoc/valid-types */
/**
 * @template T
 * @typedef {T extends import('react').ComponentType<infer U> ? U : T extends string ? import('react').ComponentPropsWithoutRef<'span'> : {}} AdditionalProps
 */
/* eslint-enable jsdoc/valid-types */

/**
 * @template P
 * @typedef {string | import('react').ComponentType<P>|ReactElement} IconType
 */

/**
 * @template P
 * @typedef BaseProps
 *
 * @property {IconType<P>|null} icon The icon to render. Supported values are: Dashicons (specified as strings), functions, WPComponent instances and `null`.
 * @property {number} [size] The size (width and height) of the icon.
 */

/**
 * @template {{size?: number}} P
 * @param {BaseProps<P> & AdditionalProps<IconType<P>>} props
 * @return {JSX.Element|null} Element
 */
function Icon( { icon = null, size, ...additionalProps } ) {
	if ( 'string' === typeof icon ) {
		return <Dashicon icon={ icon } { ...additionalProps } />;
	}

	// Type Assertion: We know `icon` is defined and we can check the `.type` property.
	if ( icon && Dashicon === /** @type {ReactElement} */ ( icon ).type ) {
		return cloneElement( /** @type {ReactElement} */ ( icon ), {
			...additionalProps,
		} );
	}

	// Icons should be 24x24 by default.
	const iconSize = size || 24;
	if ( 'function' === typeof icon ) {
		if ( icon.prototype instanceof Component ) {
			return createElement(
				icon,
				/* eslint-disable jsdoc/no-undefined-types */
				/** @type {P} */ ( {
					size: iconSize,
					...additionalProps,
				} )
				/* eslint-enable jsdoc/no-undefined-types */
			);
		}

		return /** @type {import('react').FunctionComponent} */ ( icon )( {
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
			size: iconSize,
			...additionalProps,
		} );
	}

	return icon;
}

export default Icon;

/** @typedef {import('react').ReactElement} ReactElement */
