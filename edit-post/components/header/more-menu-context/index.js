/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { createContext, createHigherOrderComponent } from '@wordpress/element';

const MoreMenuContext = createContext( { onMenuClose: noop } );

export const MoreMenuContextProvider = MoreMenuContext.Provider;

export const withMoreMenuContext = createHigherOrderComponent(
	( OriginalComponent ) => ( props ) => (
		<MoreMenuContext.Consumer>
			{ ( context ) => (
				<OriginalComponent
					{ ...props }
					moreMenuContext={ context }
				/>
			) }
		</MoreMenuContext.Consumer>
	),
	'withMoreMenuContext'
);
