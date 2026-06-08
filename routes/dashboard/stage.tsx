/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { store as viewportStore } from '@wordpress/viewport';

/**
 * Internal dependencies
 */
import { useDashboardGridSettings, useDashboardLayout } from './hooks';
import { WidgetDashboard } from './widget-dashboard';
import type { DashboardWidget } from './widget-dashboard';
import { useWidgetTypes } from './widget-primitives';

function Dashboard() {
	const [ layout, setLayout, resetLayout ] = useDashboardLayout(
		'gutenberg_dashboard'
	);

	const [ gridSettings, setGridSettings ] = useDashboardGridSettings();

	const [ widgetTypes, isResolving ] = useWidgetTypes();

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
