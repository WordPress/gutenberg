/**
 * WordPress dependencies
 */
import { createElement, forwardRef } from '@wordpress/element';

const List = ( { type = 'unordered', accessibilityLabel, ...props }, ref ) => {
	const tagName = type === 'ordered' ? 'ol' : 'ul';
	return createElement( tagName, {
		role: 'list',
		'aria-label': accessibilityLabel,
		...props,
		ref,
	} );
};

export default forwardRef( List );
