import clsx from 'clsx';
import { privateApis as routePrivateApis } from '@wordpress/route';
import { SnackbarNotices } from '@wordpress/notices';
import { SlotFillProvider } from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import { getAdminThemeColors } from '@wordpress/admin-ui';
import { ThemeProvider } from '@wordpress/theme';
import { UnsavedChangesWarning } from '@wordpress/editor';
import SavePanel from '../save-panel';
import CanvasRenderer from '../canvas-renderer';
import PluginArea from '../plugin-area';
import { unlock } from '../../lock-unlock';
import type { CanvasData } from '../../store/types';
import useSyncBodyBackground from './use-sync-body-background';
import styles from './style.module.scss';
import useRouteTitle from '../app/use-route-title';

const { useMatches, Outlet } = unlock( routePrivateApis );

/**
 * Root component for single page mode (no sidebar).
 * Used when rendering pages within wp-admin without taking over the full page.
 */
export default function RootSinglePage() {
	const matches = useMatches();
	const currentMatch = matches[ matches.length - 1 ];
	const canvas = ( currentMatch?.loaderData as any )?.canvas as
		| CanvasData
		| null
		| undefined;
	const routeContentModule = ( currentMatch?.loaderData as any )
		?.routeContentModule as string | undefined;
	const isFullScreen = canvas && ! canvas.isPreview;

	useRouteTitle();

	const themeColors = useMemo( getAdminThemeColors, [] );

	const layoutRef = useSyncBodyBackground();

	return (
		<SlotFillProvider>
			<PluginArea />
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
								[ styles[ 'has-full-canvas' ] ]: isFullScreen,
							}
						) }
					>
						<UnsavedChangesWarning />
						<SavePanel />
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
		</SlotFillProvider>
	);
}
