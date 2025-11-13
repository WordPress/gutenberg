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

/**
 * Internal dependencies
 */
import Canvas from '../canvas';
import SavePanel from '../save-panel';
import { unlock } from '../../lock-unlock';
import type { CanvasData } from '../../store/types';
import './style.scss';

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
		| undefined;
	const isFullScreen = canvas && ! canvas.isPreview;

	return (
		<ThemeProvider isRoot color={ { bg: '#f8f8f8', primary: '#3858e9' } }>
			<ThemeProvider color={ { bg: '#1d2327', primary: '#3858e9' } }>
				<div
					className={ clsx( 'boot-layout boot-layout--single-page', {
						'has-canvas': !! canvas,
						'has-full-canvas': isFullScreen,
					} ) }
				>
					<CommandMenu />
					<SavePanel />
					<div className="boot-layout__surfaces">
						<ThemeProvider
							color={ { bg: '#ffffff', primary: '#3858e9' } }
						>
							<Outlet />
							{ canvas && (
								<div className="boot-layout__canvas">
									<Canvas canvas={ canvas } />
								</div>
							) }
						</ThemeProvider>
					</div>
				</div>
			</ThemeProvider>
		</ThemeProvider>
	);
}
