/**
 * External dependencies
 */
import { Outlet } from '@tanstack/react-router';

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
import { unlock } from '../../lock-unlock';
import './style.scss';

const { ThemeProvider } = unlock( themePrivateApis );

export default function Root() {
	return (
		<ThemeProvider isRoot color={ { bg: '#f8f8f8', primary: '#3858e9' } }>
			<ThemeProvider color={ { bg: '#1e1e1e', primary: '#3858e9' } }>
				<div className="boot-layout">
					<CommandMenu />
					<div className="boot-layout__sidebar">
						<Sidebar />
					</div>
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
