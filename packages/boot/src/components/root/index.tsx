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
import Sidebar from '../sidebar';
import SavePanel from '../save-panel';
import { unlock } from '../../lock-unlock';
import type { CanvasData } from '../../store/types';
import './style.scss';

const { ThemeProvider } = unlock( themePrivateApis );
const { useMatches, Outlet } = unlock( routePrivateApis );

export default function Root() {
	const matches = useMatches();
	const currentMatch = matches[ matches.length - 1 ];
	const canvas = ( currentMatch?.loaderData as any )?.canvas as
		| CanvasData
		| null
		| undefined;
	const isFullScreen = canvas && ! canvas.isPreview;

	return (
		<ThemeProvider isRoot color={ { bg: '#f8f8f8', primary: '#3858e9' } }>
			<ThemeProvider color={ { bg: '#1d2327', primary: '#3858e9' } }>
				<div
					className={ clsx( 'boot-layout', {
						'has-canvas': !! canvas || canvas === null,
						'has-full-canvas': isFullScreen,
					} ) }
				>
					<CommandMenu />
					<SavePanel />
					<EditorSnackbars />
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
						</ThemeProvider>
					</div>
				</div>
			</ThemeProvider>
		</ThemeProvider>
	);
}
