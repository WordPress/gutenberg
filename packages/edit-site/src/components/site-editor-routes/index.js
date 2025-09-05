/**
 * WordPress dependencies
 */
import { useRegistry, useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';

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
import { stylebookRoute } from './stylebook';
import { notFoundRoute } from './notfound';

const routes = [
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
	useEffect( () => {
		registry.batch( () => {
			routes.forEach( registerRoute );
		} );
	}, [ registry, registerRoute ] );
}
