/**
 * External dependencies
 */
import initStoryshots, {
	multiSnapshotWithOptions,
} from '@storybook/addon-storyshots';
import path from 'path';

// The current version of JSDOM doesn't support MutationObserver
// This stub is needed to test the  Disabled component
// Pending PR #20766 to update jest and JSDOM may make this unnecessary
let MutationObserver;
beforeAll( () => {
	MutationObserver = window.MutationObserver;
	window.MutationObserver = function() {};
	window.MutationObserver.prototype = {
		observe() {},
		disconnect() {},
	};
} );

afterAll( () => {
	window.MutationObserver = MutationObserver;
} );

initStoryshots( {
	configPath: path.resolve( __dirname, '../' ),
	integrityOptions: { cwd: __dirname }, // it will start searching from the current directory
	test: multiSnapshotWithOptions( {} ),
} );
