/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

export const defaultLayout = { type: 'default' };

const Layout = createContext( defaultLayout );

function appendSelectors( selectors, append ) {
	return selectors
		.split( ',' )
		.map( ( subselector ) => subselector + ' ' + append )
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
					margin-left: auto;
					margin-right: auto;
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
