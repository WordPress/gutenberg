import { useHistory, useLocation, RouterProvider } from './router';
import { useLink, Link } from './link';
import { lock } from './lock-unlock';

const lockedApis = {
	useHistory,
	useLocation,
	RouterProvider,
	useLink,
	Link,
};

export type RouterPrivateApis = typeof lockedApis;

export const privateApis = {};
lock( privateApis, lockedApis );
