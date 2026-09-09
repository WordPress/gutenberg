import { defineProject } from 'vitest/config';
import {
	jsdomProject,
	nodeProject,
	sharedTestConfig,
	sharedViteConfig,
	styleMockAlias,
} from './vitest.config.mjs';

export default defineProject( {
	...sharedViteConfig,
	resolve: {
		...sharedViteConfig.resolve,
		alias: [ ...sharedViteConfig.resolve.alias, styleMockAlias ],
	},
	test: {
		...sharedTestConfig,
		name: 'unit',
		projects: [ nodeProject, jsdomProject ],
	},
} );
