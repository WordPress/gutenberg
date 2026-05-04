/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useWidgetTypes } from './widget-types/hooks/use-widget-types';
import type { WidgetType } from './widget-types/types';

type Renderer = ( props: Record< string, unknown > ) => JSX.Element | null;

function Widget( { widgetType }: { widgetType: WidgetType } ) {
	const [ Renderer, setRenderer ] = useState< Renderer | null >( null );

	useEffect( () => {
		let active = true;

		import( /* webpackIgnore: true */ widgetType.renderModule ).then(
			( mod ) => {
				if ( active && mod?.default ) {
					setRenderer( () => mod.default as Renderer );
				}
			}
		);

		return () => {
			active = false;
		};
	}, [ widgetType.renderModule ] );

	if ( ! Renderer ) {
		return null;
	}

	return <Renderer />;
}

function Dashboard() {
	const widgetTypes = useWidgetTypes();

	return (
		<Page title={ __( 'Dashboard' ) }>
			<div className="dashboard-widgets">
				{ widgetTypes
					.filter( ( widgetType ) => widgetType.renderModule )
					.map( ( widgetType ) => (
						<Widget
							key={ widgetType.name }
							widgetType={ widgetType }
						/>
					) ) }
			</div>
		</Page>
	);
}

export const stage = Dashboard;
