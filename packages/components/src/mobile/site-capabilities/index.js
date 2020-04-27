/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

export function isMentionsSupported( capabilities ) {
	return capabilities.mentions === true;
}

export const SiteCapabilitiesContext = createContext( {} );

export const useSiteCapabilities = () => {
	const siteCapabilities = useContext( SiteCapabilitiesContext );

	return siteCapabilities;
};

export const withSiteCapabilities = ( WrappedComponent ) => ( props ) => (
	<SiteCapabilitiesContext.Consumer>
		{ ( capabilities ) => (
			<WrappedComponent { ...props } capabilities={ capabilities } />
		) }
	</SiteCapabilitiesContext.Consumer>
);
