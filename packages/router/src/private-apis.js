/**
 * Internal dependencies
 */
import { useHistory, useLocation, RouterProvider } from './router';
import {
	isPreviewingTheme,
	currentlyPreviewingTheme,
} from './is-previewing-theme';
import { default as Link, useLink } from './link';
import { lock } from './lock-unlock';

export const privateApis = {};
lock( privateApis, {
	useHistory,
	useLocation,
	RouterProvider,
	isPreviewingTheme,
	currentlyPreviewingTheme,
	Link,
	useLink,
} );
