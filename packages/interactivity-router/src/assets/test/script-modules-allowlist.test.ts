/**
 * @jest-environment jsdom
 */

/**
 * Internal dependencies
 */
import {
	preloadScriptModules,
	initializeInteractiveModuleAllowlist,
	markScriptModuleAsResolved,
	clearResolvedScriptModules,
} from '../script-modules';

// Mock the dynamic-importmap module
jest.mock( '../dynamic-importmap', () => ( {
	initialImportMap: { imports: {}, scopes: {} },
	preloadWithMap: jest.fn( ( url ) => Promise.resolve( { url } ) ),
} ) );

describe( 'Interactive Module Allowlist', () => {
	let mockDocument: Document;

	beforeEach( () => {
		// Create a mock document
		mockDocument = new DOMParser().parseFromString(
			`
			<html>
				<head>
					<script type="importmap" id="wp-importmap">
						{
							"imports": {
								"@wordpress/block-library/search/view": "/wp-content/plugins/gutenberg/build-module/block-library/search/view.min.js",
								"@wordpress/some-other-module": "/wp-content/plugins/gutenberg/build-module/some-other/index.min.js"
							}
						}
					</script>
				</head>
				<body>
					<script type="module" src="/wp-content/plugins/gutenberg/build-module/block-library/search/view.min.js"></script>
					<script type="module" src="/wp-content/plugins/gutenberg/build-module/some-other/index.min.js"></script>
					<script type="module" src="/wp-content/plugins/other-plugin/script.js"></script>
				</body>
			</html>
		`,
			'text/html'
		);

		// Reset the allowlist
		initializeInteractiveModuleAllowlist( [] );
	} );

	afterEach( () => {
		// Clear all mocks and reset state
		jest.clearAllMocks();

		// Reset the allowlist and resolved modules after each test
		initializeInteractiveModuleAllowlist( [] );
		clearResolvedScriptModules();
	} );

	it( 'should filter modules based on interactive block patterns', () => {
		const modules = preloadScriptModules( mockDocument );

		// Should only include the search view module, not the other modules
		expect( modules ).toHaveLength( 1 );
	} );

	it( 'should include modules in the explicit allowlist', () => {
		// Add a specific module to the allowlist
		initializeInteractiveModuleAllowlist( [
			'@wordpress/some-other-module',
		] );

		const modules = preloadScriptModules( mockDocument );

		// Should include both the pattern-matched module and the allowlisted module
		expect( modules ).toHaveLength( 2 );
	} );

	it( 'should exclude modules that are already resolved', () => {
		// Mark the search view module as already resolved
		markScriptModuleAsResolved(
			'/wp-content/plugins/gutenberg/build-module/block-library/search/view.min.js'
		);

		const modules = preloadScriptModules( mockDocument );

		// Should exclude the resolved module
		expect( modules ).toHaveLength( 0 );
	} );

	it( 'should include modules with /view pattern from block-library', () => {
		const testDocument = new DOMParser().parseFromString(
			`
			<html>
				<head>
					<script type="importmap" id="wp-importmap">
						{
							"imports": {
								"@wordpress/block-library/navigation/view": "/wp-content/plugins/gutenberg/build-module/block-library/navigation/view.min.js",
								"@wordpress/block-library/query/view": "/wp-content/plugins/gutenberg/build-module/block-library/query/view.min.js",
								"@wordpress/block-library/navigation/edit": "/wp-content/plugins/gutenberg/build-module/block-library/navigation/edit.min.js"
							}
						}
					</script>
				</head>
				<body>
					<script type="module" src="/wp-content/plugins/gutenberg/build-module/block-library/navigation/view.min.js"></script>
					<script type="module" src="/wp-content/plugins/gutenberg/build-module/block-library/query/view.min.js"></script>
					<script type="module" src="/wp-content/plugins/gutenberg/build-module/block-library/navigation/edit.min.js"></script>
				</body>
			</html>
		`,
			'text/html'
		);

		const modules = preloadScriptModules( testDocument );

		// Should include both view modules but not the edit module
		expect( modules ).toHaveLength( 2 );
	} );

	it( 'should handle documents without import maps', () => {
		const testDocument = new DOMParser().parseFromString(
			`
			<html>
				<body>
					<script type="module" src="/some-module.js"></script>
				</body>
			</html>
		`,
			'text/html'
		);

		const modules = preloadScriptModules( testDocument );

		// Should handle gracefully and return empty array
		expect( modules ).toHaveLength( 0 );
	} );
} );
