import { useEffect, useRef } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import { store as noticesStore } from '@wordpress/notices';
import { __, sprintf } from '@wordpress/i18n';
import {
	createDashboardWidget,
	type DashboardWidget,
} from '@wordpress/widget-dashboard';
import type { WidgetType } from '@wordpress/widget-primitives';

export const SCOPE = 'core/dashboard';
export const KEY = 'knownWidgetTypes';

interface UseDashboardUnseenWidgetsProps {
	widgetTypes: WidgetType[];
	isResolvingWidgetTypes: boolean;
	layout: DashboardWidget[];
	onLayoutChange: ( layout: DashboardWidget[] ) => void;
}

/**
 * Detects widget types registered after the user's layout was saved,
 * announcing them via notices and offering the user the choice to insert
 * or ignore them (or auto-inserting them if declared as 'auto').
 */
export function useDashboardUnseenWidgets( {
	widgetTypes,
	isResolvingWidgetTypes,
	layout,
	onLayoutChange,
}: UseDashboardUnseenWidgetsProps ): void {
	const knownWidgetTypes = useSelect(
		( select ) =>
			select( preferencesStore ).get( SCOPE, KEY ) as
				| string[]
				| undefined,
		[]
	);

	const { set } = useDispatch( preferencesStore );
	const { createNotice, removeNotice } = useDispatch( noticesStore );

	const layoutRef = useRef( layout );
	layoutRef.current = layout;

	const onLayoutChangeRef = useRef( onLayoutChange );
	onLayoutChangeRef.current = onLayoutChange;

	const announcedRef = useRef< Set< string > >( new Set() );

	useEffect( () => {
		if ( isResolvingWidgetTypes || ! widgetTypes.length ) {
			return;
		}

		// First visit: seed known list with all currently registered types.
		if ( knownWidgetTypes === undefined ) {
			const allTypes = widgetTypes.map( ( t ) => t.name );
			void set( SCOPE, KEY, allTypes );
			return;
		}

		const unseenTypes = widgetTypes.filter(
			( t ) =>
				! knownWidgetTypes.includes( t.name ) &&
				! announcedRef.current.has( t.name )
		);

		if ( ! unseenTypes.length ) {
			return;
		}

		for ( const type of unseenTypes ) {
			announcedRef.current.add( type.name );
		}

		const nextKnown = [
			...knownWidgetTypes,
			...unseenTypes.map( ( t ) => t.name ),
		];
		void set( SCOPE, KEY, nextKnown );

		let currentLayout = layoutRef.current;
		const autoWidgetsToAdd: DashboardWidget[] = [];

		for ( const widgetType of unseenTypes ) {
			const noticeId = `new-widget-type-${ widgetType.name }`;
			const isAuto = widgetType.presence === 'auto';
			const provenance = widgetType.provenance;
			const isPlugin = provenance && provenance !== 'core';

			if ( isAuto ) {
				const newWidget = createDashboardWidget( widgetType );
				autoWidgetsToAdd.push( newWidget );

				const message = isPlugin
					? sprintf(
							/* translators: 1: plugin name, 2: widget title */
							__( 'The "%1$s" plugin added a new widget: %2$s.' ),
							provenance,
							widgetType.title
					  )
					: sprintf(
							/* translators: %s: widget title */
							__( 'A new widget was added: %s.' ),
							widgetType.title
					  );

				void createNotice( 'info', message, {
					id: noticeId,
					isDismissible: true,
					actions: [
						{
							label: __( 'Remove' ),
							onClick: () => {
								const filtered = layoutRef.current.filter(
									( w ) => w.uuid !== newWidget.uuid
								);
								onLayoutChangeRef.current( filtered );
								void removeNotice( noticeId );
							},
						},
					],
				} );
			} else {
				const message = isPlugin
					? sprintf(
							/* translators: 1: plugin name, 2: widget title */
							__( 'The "%1$s" plugin added a new widget: %2$s.' ),
							provenance,
							widgetType.title
					  )
					: sprintf(
							/* translators: %s: widget title */
							__( 'A new widget is available: %s.' ),
							widgetType.title
					  );

				void createNotice( 'info', message, {
					id: noticeId,
					isDismissible: true,
					actions: [
						{
							label: __( 'Insert' ),
							onClick: () => {
								const widgetInstance =
									createDashboardWidget( widgetType );
								onLayoutChangeRef.current( [
									...layoutRef.current,
									widgetInstance,
								] );
								void removeNotice( noticeId );
							},
						},
						{
							label: __( 'Ignore' ),
							onClick: () => {
								void removeNotice( noticeId );
							},
						},
					],
				} );
			}
		}

		if ( autoWidgetsToAdd.length > 0 ) {
			currentLayout = [ ...currentLayout, ...autoWidgetsToAdd ];
			onLayoutChangeRef.current( currentLayout );
		}
	}, [
		isResolvingWidgetTypes,
		widgetTypes,
		knownWidgetTypes,
		set,
		createNotice,
		removeNotice,
	] );
}
