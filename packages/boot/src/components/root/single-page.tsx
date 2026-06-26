/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { privateApis as routePrivateApis } from '@wordpress/route';
import { SnackbarNotices } from '@wordpress/notices';
import { SlotFillProvider } from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import { getAdminThemeColors } from '@wordpress/admin-ui';
import { privateApis as themePrivateApis } from '@wordpress/theme';

/**
 * Internal dependencies
 */
import SavePanel from '../save-panel';
import CanvasRenderer from '../canvas-renderer';
import { unlock } from '../../lock-unlock';
import type { CanvasData } from '../../store/types';
import './style.scss';
import useRouteTitle from '../app/use-route-title';

const { useMatches, Outlet } = unlock( routePrivateApis );
const { ThemeProvider } = unlock( themePrivateApis );

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

	return (
		<SlotFillProvider>
			<ThemeProvider
				isRoot
				color={ { ...themeColors, background: '#f8f8f8' } }
			>
				<ThemeProvider color={ themeColors }>
					<div
						className={ clsx(
							'boot-layout boot-layout--single-page',
							{
								'has-canvas': !! canvas || canvas === null,
								'has-full-canvas': isFullScreen,
							}
						) }
					>
						<SavePanel />
						<SnackbarNotices className="boot-notices__snackbar" />
						<div className="boot-layout__surfaces">
							<ThemeProvider
								color={ {
									...themeColors,
									background: '#ffffff',
								} }
							>
								<Outlet />
								{ /* Render Canvas in Root to prevent remounting on route changes */ }
								{ ( canvas || canvas === null ) && (
									<div className="boot-layout__canvas">
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
