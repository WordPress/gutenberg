/**
 * Internal dependencies
 */
import {
	useHistory,
	useLocation,
	RouterProvider,
	recognizePath,
} from './router';
import { useLink, Link } from './link';
import { lock } from './lock-unlock';

export const privateApis = {};
lock( privateApis, {
	useHistory,
	useLocation,
	RouterProvider,
	useLink,
	Link,
	recognizePath,
} );
