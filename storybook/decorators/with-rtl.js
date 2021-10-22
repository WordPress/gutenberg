/**
 * External dependencies
 */
import { forceReRender } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { addFilter, removeFilter } from '@wordpress/hooks';
import { useEffect, useRef } from '@wordpress/element';

export const WithRTL = ( Story, context ) => {
	const ref = useRef();

	useEffect( () => {
		// Override the return value of i18n.isRTL()
		addFilter(
			'i18n.gettext_with_context',
			'storybook',
			( translation, text, _context ) => {
				if ( text === 'ltr' && _context === 'text direction' ) {
					return context.globals.direction;
				}
				return translation;
			}
		);

		ref.current.ownerDocument.documentElement.setAttribute(
			'dir',
			context.globals.direction
		);

		forceReRender();

		return () => removeFilter( 'i18n.gettext_with_context', 'storybook' );
	}, [ context.globals.direction ] );

	return (
		<div ref={ ref }>
			<Story { ...context } />
		</div>
	);
};
