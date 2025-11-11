/**
 * External dependencies
 */
import { Outlet, useMatches } from '@tanstack/react-router';
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
// @ts-expect-error Commands is not typed properly.
import { CommandMenu } from '@wordpress/commands';
import { privateApis as themePrivateApis } from '@wordpress/theme';

/**
 * Internal dependencies
 */
import Sidebar from '../sidebar';
import Canvas from '../canvas';
import { unlock } from '../../lock-unlock';
import type { CanvasData } from '../../store/types';
import './style.scss';

const { ThemeProvider } = unlock( themePrivateApis );

export default function Root() {
	// Get canvas data from the current route's loader
	const matches = useMatches();
	const currentMatch = matches[ matches.length - 1 ];
	const canvas = ( currentMatch?.loaderData as any )?.canvas as
		| CanvasData
		| undefined;
	const isFullScreen = canvas && ! canvas.isPreview;

	return (
		<ThemeProvider isRoot color={ { bg: '#f8f8f8', primary: '#3858e9' } }>
			<ThemeProvider color={ { bg: '#1e1e1e', primary: '#3858e9' } }>
				<div
					className={ clsx( 'boot-layout', {
						'has-canvas': !! canvas,
						'has-full-canvas': isFullScreen,
					} ) }
				>
					<CommandMenu />
					{ ! isFullScreen && (
						<div className="boot-layout__sidebar">
							<Sidebar />
						</div>
					) }
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
