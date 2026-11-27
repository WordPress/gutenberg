import clsx from 'clsx';
import { privateApis as routePrivateApis } from '@wordpress/route';
import { privateApis as coreDataPrivateApis } from '@wordpress/core-data';
import { SnackbarNotices } from '@wordpress/notices';
import { SlotFillProvider } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { Page, getAdminThemeColors } from '@wordpress/admin-ui';
import { Tooltip } from '@wordpress/ui';
import { ThemeProvider } from '@wordpress/theme';
import SavePanel from '../save-panel';
import SaveButton from '../save-button';
import CanvasRenderer from '../canvas-renderer';
import PluginArea from '../plugin-area';
import EditorFullscreenMode, {
	useIsEditorFullscreenMode,
} from '../editor-fullscreen-mode';
import { unlock } from '../../lock-unlock';
import { store as bootStore } from '../../store';
import type { CanvasData } from '../../store/types';
import useSyncBodyBackground from './use-sync-body-background';
import useAdminMenuSync from './use-admin-menu-sync';
import styles from './style.module.scss';
import useRouteTitle from '../app/use-route-title';
import useRouteFocus from '../app/use-route-focus';

const { useMatches, Outlet } = unlock( routePrivateApis );
const { UnsavedChangesWarning } = unlock( coreDataPrivateApis );

/**
 * Root component for single page mode (no sidebar).
 * Used when rendering pages within wp-admin without taking over the full page.
 */
export default function RootSinglePage() {
	const matches = useMatches();
	const currentMatch = matches[ matches.length - 1 ];
	const canvas = ( currentMatch?.loaderData as any )?.canvas as
		CanvasData | null | undefined;
	const routeContentModule = ( currentMatch?.loaderData as any )
		?.routeContentModule as string | undefined;
	const isEditorCanvas = canvas && ! canvas.isPreview;
	const isFullscreenMode = useIsEditorFullscreenMode();
	// Other single-page screens, such as Fonts or Connectors, have their own
	// save flows. Only pages that edit entities in the canvas get the button.
	const showSaveButton = useSelect(
		( select ) => select( bootStore ).hasEntityLinks(),
		[]
	);

	useRouteTitle();
	useAdminMenuSync( isEditorCanvas ? canvas.postType : undefined );

	const themeColors = useMemo( getAdminThemeColors, [] );

	const layoutRef = useSyncBodyBackground();
	useRouteFocus( layoutRef );

	return (
		<SlotFillProvider>
			<Tooltip.Provider>
				<PluginArea />
				{ isEditorCanvas && (
					<EditorFullscreenMode isActive={ isFullscreenMode } />
				) }
				<ThemeProvider
					isRoot
					color={ { ...themeColors, background: '#f8f8f8' } }
				>
					<ThemeProvider color={ themeColors }>
						<div
							ref={ layoutRef }
							className={ clsx(
								styles.layout,
								styles[ 'layout-single-page' ],
								{
									[ styles[ 'has-canvas' ] ]:
										!! canvas || canvas === null,
									[ styles[ 'has-full-canvas' ] ]:
										isEditorCanvas,
								}
							) }
						>
							<UnsavedChangesWarning />
							<SavePanel />
							{ showSaveButton && (
								<Page.HeaderActionsFill>
									<SaveButton isFullWidth={ false } />
								</Page.HeaderActionsFill>
							) }
							<SnackbarNotices
								className={ styles[ 'notices-snackbar' ] }
							/>
							<div className={ styles.surfaces }>
								<ThemeProvider
									color={ {
										...themeColors,
										// Reset to the default background color.
										background: '#fcfcfc',
									} }
								>
									<Outlet />
									{ /* Render Canvas in Root to prevent remounting on route changes */ }
									{ ( canvas || canvas === null ) && (
										<div className={ styles.canvas }>
											<CanvasRenderer
												canvas={ canvas }
												showBackButton={
													isFullscreenMode
												}
												routeContentModule={
													routeContentModule
												}
											/>
										</div>
									) }
								</ThemeProvider>
							</div>
						</div>
					</ThemeProvider>
				</ThemeProvider>
			</Tooltip.Provider>
		</SlotFillProvider>
	);
}
