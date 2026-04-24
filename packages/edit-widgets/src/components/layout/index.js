/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { PluginArea } from '@wordpress/plugins';
import { store as noticesStore } from '@wordpress/notices';
import { __unstableUseNavigateRegions as useNavigateRegions } from '@wordpress/components';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import ErrorBoundary from '../error-boundary';
import WidgetAreasBlockEditorProvider from '../widget-areas-block-editor-provider';
import Sidebar from '../sidebar';
import Interface from './interface';
import UnsavedChangesWarning from './unsaved-changes-warning';
import WelcomeGuide from '../welcome-guide';

function Layout( { blockEditorSettings } ) {
	const { createErrorNotice } = useDispatch( noticesStore );

	function onPluginAreaError( name ) {
		createErrorNotice(
			sprintf(
				/* translators: %s: plugin name */
				__(
					'The "%s" plugin has encountered an error and cannot be rendered.'
				),
				name
			)
		);
	}

	const { showIconLabels } = useSelect( ( select ) => {
		return {
			showIconLabels: select( preferencesStore ).get(
				'core',
				'showIconLabels'
			),
		};
	} );

	const navigateRegionsProps = useNavigateRegions();

	return (
		<ErrorBoundary>
			<div
				{ ...navigateRegionsProps }
				ref={ navigateRegionsProps.ref }
				className={ clsx(
					'edit-widgets-layout',
					navigateRegionsProps.className,
					{
						'show-icon-labels': showIconLabels,
					}
				) }
			>
				<WidgetAreasBlockEditorProvider
					blockEditorSettings={ blockEditorSettings }
				>
					<Interface blockEditorSettings={ blockEditorSettings } />
					<Sidebar />
					<PluginArea onError={ onPluginAreaError } />
					<UnsavedChangesWarning />
					<WelcomeGuide />
				</WidgetAreasBlockEditorProvider>
			</div>
		</ErrorBoundary>
	);
}

export default Layout;
