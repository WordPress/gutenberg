/**
 * WordPress dependencies
 */
import { useRegistry, useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { store as siteEditorStore } from '../../store';
import { homeRoute } from './home';
import { stylesRoute } from './styles';
import { navigationRoute } from './navigation';
import { navigationItemRoute } from './navigation-item';
import { patternsRoute } from './patterns';
import { patternItemRoute } from './pattern-item';
import { templatePartItemRoute } from './template-part-item';
import { templatesRoute } from './templates';
import { templateItemRoute } from './template-item';
import { pagesRoute } from './pages';
import { pageItemRoute } from './page-item';
import { attachmentItemRoute } from './attachment-item';
import { stylebookRoute } from './stylebook';
import { notFoundRoute } from './notfound';
import { guidelinesRoute } from './guidelines';

const baseRoutes = [
	...( window?.__experimentalMediaEditor ? [ attachmentItemRoute ] : [] ),
	pageItemRoute,
	pagesRoute,
	templateItemRoute,
	templatesRoute,
	templatePartItemRoute,
	patternItemRoute,
	patternsRoute,
	navigationItemRoute,
	navigationRoute,
	stylesRoute,
	homeRoute,
	stylebookRoute,
	notFoundRoute,
];

export function useRegisterSiteEditorRoutes() {
	const registry = useRegistry();
	const { registerRoute } = unlock( useDispatch( siteEditorStore ) );

	// Check if Content Guidelines experiment is enabled.
	const isContentGuidelinesEnabled = useSelect( ( select ) => {
		const settings = select( coreStore ).getEntityRecord(
			'root',
			'__unstableBase'
		);
		return settings?.contentGuidelinesEnabled ?? false;
	}, [] );

	useEffect( () => {
		const routes = [ ...baseRoutes ];

		// Add guidelines route if experiment is enabled.
		if ( isContentGuidelinesEnabled ) {
			routes.push( guidelinesRoute );
		}

		registry.batch( () => {
			routes.forEach( registerRoute );
		} );
	}, [ registry, registerRoute, isContentGuidelinesEnabled ] );
}
