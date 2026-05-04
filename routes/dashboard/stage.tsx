/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import { Suspense, type ComponentType } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useWidgetTypes } from './widget-types/hooks/use-widget-types';
import type { WidgetType } from './widget-types/types';

function isValidWidgetModule(
	module: unknown
): module is { default: ComponentType } {
	return (
		typeof module === 'object' &&
		module !== null &&
		'default' in module &&
		typeof ( module as { default: unknown } ).default === 'function'
	);
}

type WidgetModule = { default: ComponentType };
type WidgetModuleResource =
	| { status: 'pending'; promise: Promise< void > }
	| { status: 'fulfilled'; module: WidgetModule }
	| { status: 'rejected'; error: unknown };

const widgetModules = new Map< string, WidgetModuleResource >();

function loadWidgetModule( renderModule: string ) {
	let resource = widgetModules.get( renderModule );

	if ( ! resource ) {
		const promise = import( renderModule )
			.then( ( module: unknown ) => {
				if ( ! isValidWidgetModule( module ) ) {
					throw new Error(
						`Invalid widget module: ${ renderModule }`
					);
				}

				widgetModules.set( renderModule, {
					status: 'fulfilled',
					module,
				} );
			} )
			.catch( ( error: unknown ) => {
				widgetModules.set( renderModule, {
					status: 'rejected',
					error,
				} );
				throw error;
			} );

		resource = { status: 'pending', promise };
		widgetModules.set( renderModule, resource );
	}

	return resource;
}

function getWidgetModule( renderModule: string ) {
	const resource = loadWidgetModule( renderModule );

	if ( resource.status === 'pending' ) {
		throw resource.promise;
	}

	if ( resource.status === 'rejected' ) {
		throw resource.error;
	}

	return resource.module;
}

type WidgetRenderProps = { widgetType: WidgetType };

function WidgetRender( { widgetType }: WidgetRenderProps ) {
	const WidgetComponent = getWidgetModule( widgetType.renderModule ).default;

	return (
		<Suspense fallback={ null }>
			<WidgetComponent />
		</Suspense>
	);
}

function Dashboard() {
	const widgetTypes = useWidgetTypes();

	return (
		<Page title={ __( 'Dashboard' ) }>
			<div className="dashboard-widgets">
				{ widgetTypes
					.filter( ( widgetType ) => widgetType.renderModule )
					.map( ( widgetType ) => (
						<WidgetRender
							key={ widgetType.name }
							widgetType={ widgetType }
						/>
					) ) }
			</div>
		</Page>
	);
}

export const stage = Dashboard;
