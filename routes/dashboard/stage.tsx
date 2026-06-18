/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import { store as coreStore } from '@wordpress/core-data';
import { dispatch, useDispatch, useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { store as viewportStore } from '@wordpress/viewport';
import { useWidgetTypes } from '@wordpress/widget-primitives';

/**
 * Internal dependencies
 */
import { useDashboardGridSettings, useDashboardLayout } from './hooks';
import { WidgetDashboard } from './widget-dashboard';
import type { DashboardWidget } from './widget-dashboard';

/* Register the widget-modules discovery entity for this host before the
   dashboard renders. The route module loads only when the dashboard page
   does, so this runs gated and ahead of the `useWidgetTypes` read below. */
dispatch( coreStore ).addEntities( [
	{
		name: 'widgetModule',
		kind: 'root',
		key: 'name',
		baseURL: '/wp/v2/widget-modules',
		plural: 'widgetModules',
		label: __( 'Widget modules' ),
		supportsPagination: false,
	},
] );

function Dashboard() {
	const [ layout, setLayout, resetLayout ] = useDashboardLayout(
		'gutenberg_dashboard'
	);

	const [ gridSettings, setGridSettings ] = useDashboardGridSettings();

	const [ widgetTypes, isResolving ] = useWidgetTypes( {
		kind: 'root',
		name: 'widgetModule',
	} );

	const [ editMode, setEditMode ] = useState( false );

	// @TODO: switch to using Admin UI declaratively for mobile viewport support once available.
	// https://github.com/WordPress/gutenberg/issues/77628
	const isMobileViewport = useSelect(
		( select ) => select( viewportStore ).isViewportMatch( '< small' ),
		[]
	);

	const greetingName = useSelect( ( select ) => {
		const user = select( coreStore ).getCurrentUser();
		if ( ! user ) {
			return undefined;
		}

		const displayName = user.name?.trim();
		if ( displayName ) {
			return displayName;
		}

		if ( 'username' in user && typeof user.username === 'string' ) {
			const username = user.username.trim();
			if ( username ) {
				return username;
			}
		}

		return user.slug;
	}, [] );

	const { createSuccessNotice } = useDispatch( noticesStore );

	const handleLayoutChange = ( next: DashboardWidget[] ) => {
		setLayout( next );
		void createSuccessNotice( __( 'Dashboard saved.' ), {
			type: 'snackbar',
		} );
	};

	let pageTitle: string = __( 'Dashboard' );
	if ( editMode ) {
		pageTitle = __( 'Customize Dashboard' );
	} else if ( greetingName ) {
		pageTitle = sprintf(
			/* translators: %s: current user's display name. */
			__( 'Howdy, %s' ),
			greetingName
		);
	}

	return (
		<WidgetDashboard
			widgetTypes={ widgetTypes }
			isResolvingWidgetTypes={ isResolving }
			layout={ layout }
			onLayoutChange={ handleLayoutChange }
			onLayoutReset={ resetLayout }
			gridSettings={ gridSettings }
			onGridSettingsChange={ setGridSettings }
			editMode={ editMode }
			onEditChange={ setEditMode }
		>
			<Page
				title={ editMode && isMobileViewport ? undefined : pageTitle }
				ariaLabel={ pageTitle }
				actions={ <WidgetDashboard.Actions /> }
				hasPadding
			>
				<WidgetDashboard.NoWidgetsState />
				<WidgetDashboard.Widgets />
			</Page>
		</WidgetDashboard>
	);
}

export const stage = Dashboard;
