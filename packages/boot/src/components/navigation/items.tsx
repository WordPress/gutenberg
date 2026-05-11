/**
 * WordPress dependencies
 */
import { isValidElement } from '@wordpress/element';
import { Dashicon, Icon } from '@wordpress/components';
import { SVG } from '@wordpress/primitives';

/**
 * Internal dependencies
 */
import type { IconType } from '../../store/types';

/**
 * Type guard for verifying whether a given element
 * is a valid SVG element for the Icon component.
 *
 * @param element - The element to check
 */
function isSvg( element: unknown ): element is React.JSX.Element {
	return (
		isValidElement( element ) &&
		( element.type === SVG || element.type === 'svg' )
	);
}

/**
 * Converts the given IconType into a renderable component:
 * - Dashicon string into a Dashicon component
 * - JSX SVG element into an Icon component
 * - Data URL into an img element
 *
 * @param icon                  - The icon to convert
 * @param shouldShowPlaceholder - Whether to show placeholder when no icon is provided
 * @return The converted icon as a JSX element
 */
export function wrapIcon(
	icon?: IconType,
	shouldShowPlaceholder: boolean = true
) {
	if ( isSvg( icon ) ) {
		return <Icon icon={ icon } />;
	}

	if ( typeof icon === 'string' && icon.startsWith( 'dashicons-' ) ) {
		const iconKey = icon.replace(
			/^dashicons-/,
			''
		) as React.ComponentProps< typeof Dashicon >[ 'icon' ];

		return (
			<Dashicon
				style={ { padding: '2px' } }
				icon={ iconKey }
				aria-hidden="true"
			/>
		);
	}

	// Handle data URLs (SVG images)
	if ( typeof icon === 'string' && icon.startsWith( 'data:' ) ) {
		return (
			<img
				src={ icon }
				alt=""
				aria-hidden="true"
				style={ {
					width: '20px',
					height: '20px',
					display: 'block',
					padding: '2px',
				} }
			/>
		);
	}

	// If icon is provided and valid, return it as-is
	if ( icon ) {
		return icon;
	}

	// Return empty 24px placeholder for alignment when no icon is provided
	// Only if shouldShowPlaceholder is true
	if ( shouldShowPlaceholder ) {
		return (
			<div
				style={ { width: '24px', height: '24px' } }
				aria-hidden="true"
			/>
		);
	}

	return null;
}
