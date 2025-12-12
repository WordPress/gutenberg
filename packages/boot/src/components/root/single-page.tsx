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
import { privateApis as themePrivateApis } from '@wordpress/theme';
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

	return (
		<ThemeProvider isRoot color={ { bg: '#f8f8f8', primary: '#3858e9' } }>
			<ThemeProvider color={ { bg: '#1d2327', primary: '#3858e9' } }>
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
						<ThemeProvider
							color={ { bg: '#ffffff', primary: '#3858e9' } }
						>
							<Outlet />
						</ThemeProvider>
						{ /* Render Canvas in Root to prevent remounting on route changes */ }
						{ ( canvas || canvas === null ) && (
							<div className="boot-layout__canvas">
								<CanvasRenderer
									canvas={ canvas }
									routeContentModule={ routeContentModule }
								/>
							</div>
						) }
					</div>
				</div>
			</ThemeProvider>
		</ThemeProvider>
	);
}
