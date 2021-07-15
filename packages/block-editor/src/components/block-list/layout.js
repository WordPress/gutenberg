/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

export const defaultLayout = { type: 'default' };

const Layout = createContext( defaultLayout );

function appendSelectors( selectors, append ) {
	// Ideally we shouldn't need the `.editor-styles-wrapper` increased specificity here
	// The problem though is that we have a `.editor-styles-wrapper p { margin: reset; }` style
	// it's used to reset the default margin added by wp-admin to paragraphs
	// so we need this to be higher speficity otherwise, it won't be applied to paragraphs inside containers
	// When the post editor is fully iframed, this extra classname could be removed.

	return selectors
		.split( ',' )
		.map(
			( subselector ) =>
				`.editor-styles-wrapper ${ subselector } ${ append }`
		)
		.join( ',' );
}

/**
 * Allows to define the layout.
 */
export const LayoutProvider = Layout.Provider;

/**
 * React hook used to retrieve the layout config.
 */
export function useLayout() {
	return useContext( Layout );
}

export function LayoutStyle( { selector, layout = {} } ) {
	const { contentSize, wideSize } = layout;

	let style =
		!! contentSize || !! wideSize
			? `
				${ appendSelectors( selector, '> *' ) } {
					max-width: ${ contentSize ?? wideSize };
					margin-left: auto !important;
					margin-right: auto !important;
				}

				${ appendSelectors( selector, '> [data-align="wide"]' ) }  {
					max-width: ${ wideSize ?? contentSize };
				}

				${ appendSelectors( selector, '> [data-align="full"]' ) } {
					max-width: none;
				}
			`
			: '';

	style += `
		${ appendSelectors( selector, '> [data-align="left"]' ) } {
			float: left;
			margin-right: 2em;
		}

		${ appendSelectors( selector, '> [data-align="right"]' ) } {
			float: right;
			margin-left: 2em;
		}
	`;

	return <style>{ style }</style>;
}
