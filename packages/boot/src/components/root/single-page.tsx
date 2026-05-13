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

/**
 * Internal dependencies
 */
import SavePanel from '../save-panel';
import CanvasRenderer from '../canvas-renderer';
import { unlock } from '../../lock-unlock';
import type { CanvasData } from '../../store/types';
import './style.scss';
import useRouteTitle from '../app/use-route-title';
import { UserThemeProvider } from '../user-theme-provider';

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

	return (
		<SlotFillProvider>
			<UserThemeProvider isRoot color={ { bg: '#f8f8f8' } }>
				<UserThemeProvider color={ { bg: '#1d2327' } }>
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
							<UserThemeProvider color={ { bg: '#ffffff' } }>
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
							</UserThemeProvider>
						</div>
					</div>
				</UserThemeProvider>
			</UserThemeProvider>
		</SlotFillProvider>
	);
}
