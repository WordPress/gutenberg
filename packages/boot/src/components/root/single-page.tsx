/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { privateApis as routePrivateApis } from '@wordpress/route';
// @ts-expect-error Commands is not typed properly.
import { CommandMenu } from '@wordpress/commands';
import { EditorSnackbars } from '@wordpress/editor';

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
		<UserThemeProvider isRoot color={ { bg: '#f8f8f8' } }>
			<UserThemeProvider color={ { bg: '#1d2327' } }>
				<div
					className={ clsx( 'boot-layout boot-layout--single-page', {
						'has-canvas': !! canvas || canvas === null,
						'has-full-canvas': isFullScreen,
					} ) }
				>
					<CommandMenu />
					<SavePanel />
					<EditorSnackbars />
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
	);
}
