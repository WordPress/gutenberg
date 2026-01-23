import clsx from 'clsx';
import { useEffect } from '@wordpress/element';
import basicStyles from '../global-basic.scss?inline';
import wordPressStyles from '../global-wordpress.scss?inline';

/**
 * A Storybook decorator to inject global CSS.
 *
 * This helps test whether our components have sufficient styles to
 * hold up in various CSS environments.
 */

const config = {
	none: {
		lazyStyles: [],
		externalStyles: [],
		classes: [],
	},
	basic: {
		lazyStyles: [ basicStyles ],
		externalStyles: [],
		classes: [],
	},
	wordpress: {
		lazyStyles: [ wordPressStyles ],
		externalStyles: [
			// wp-admin loads "global" stylesheets which contain some broadly scoped styles
			// that affect wp-components
			'https://wordpress.org/gutenberg/wp-admin/css/common.min.css',
			'https://wordpress.org/gutenberg/wp-admin/css/forms.min.css',
			// Icon components need to support dashicons for backwards compatibility
			'https://wordpress.org/gutenberg/wp-includes/css/dashicons.min.css',
		],
		// In wp-admin, these classes are added to the body element,
		// which is used as a class scope for some relevant styles in the external
		// stylesheets listed above. We simulate that here by adding the classes to a wrapper element.
		classes: [ 'wp-admin', 'wp-core-ui' ],
	},
};

export const WithGlobalCSS = ( Story, context ) => {
	const { lazyStyles, externalStyles, classes } =
		config[ context.globals.css ];

	useEffect( () => {
		const style = document.createElement( 'style' );
		style.textContent = lazyStyles.join( '\n' );
		document.head.appendChild( style );
		return () => document.head.removeChild( style );
	}, [ context.globals.css, lazyStyles ] );

	return (
		<div className={ clsx( classes ) }>
			{ externalStyles.map( ( stylesheet ) => (
				<link key={ stylesheet } rel="stylesheet" href={ stylesheet } />
			) ) }

			<Story { ...context } />
		</div>
	);
};
