/**
 * A jscodeshift codemod that replaces imports from `@wordpress/element`
 * with appropriate imports from `react` and `react-dom` in JavaScript and TypeScript files.
 * Additionally, it updates comments containing `@wordpress/element` to indicate the new imports.
 *
 * Run like this (change \/ to /):
 * ```
 * npx jscodeshift -t bin/element-to-react-codemod.js . --extensions=js,jsx,ts,tsx --parser=tsx --ignore-pattern="**\/packages/element/**" --ignore-pattern="**\/node_modules/**" --ignore-pattern="**\/vendor/**" --ignore-pattern="**\/*.d.ts"
 * ```
 * Then run:
 * ```
 * npm run lint:js -- --fix
 * ```
 *
 * @param {Object} fileInfo - The file information object provided by jscodeshift.
 * @param {Object} api      - The API object provided by jscodeshift, used to access jscodeshift methods.
 * @return {string} The transformed source code with updated imports and comments.
 */
export default function transformer( fileInfo, api ) {
	const j = api.jscodeshift;
	const root = j( fileInfo.source );

	// Mapping of imports from @wordpress/element to react/react-dom
	const elementToReactMap = {
		createElement: 'react',
		Component: 'react',
		Fragment: 'react',
		cloneElement: 'react',
		isValidElement: 'react',
		Children: 'react',
		createRef: 'react',
		forwardRef: 'react',
		memo: 'react',
		useRef: 'react',
		useState: 'react',
		useEffect: 'react',
		useContext: 'react',
		useReducer: 'react',
		useCallback: 'react',
		useMemo: 'react',
		useLayoutEffect: 'react',
		useImperativeHandle: 'react',

		render: 'react-dom',
		unmountComponentAtNode: 'react-dom',
		findDOMNode: 'react-dom',
		hydrate: 'react-dom',
		createPortal: 'react-dom',
	};

	// Find all imports from '@wordpress/element'
	const wordpressElementImports = root.find( j.ImportDeclaration, {
		source: {
			value: '@wordpress/element',
		},
	} );

	// If there are no imports from '@wordpress/element', do nothing
	if ( wordpressElementImports.size() === 0 ) {
		return null;
	}

	// Object to hold the new import specifiers for react and react-dom
	const reactImports = [];
	const reactDomImports = [];

	// Iterate over each import from @wordpress/element
	wordpressElementImports.forEach( ( path ) => {
		const specifiers = path.node.specifiers;

		specifiers.forEach( ( specifier ) => {
			// Check if specifier has an `imported` property (named imports)
			if ( specifier.imported && specifier.imported.name ) {
				const importedName = specifier.imported.name;
				const localName = specifier.local.name;
				const sourceModule = elementToReactMap[ importedName ];

				if ( sourceModule === 'react' ) {
					reactImports.push(
						j.importSpecifier(
							j.identifier( importedName ),
							j.identifier( localName )
						)
					);
				} else if ( sourceModule === 'react-dom' ) {
					reactDomImports.push(
						j.importSpecifier(
							j.identifier( importedName ),
							j.identifier( localName )
						)
					);
				}
			}
		} );

		// Remove the original @wordpress/element import declaration
		j( path ).remove();
	} );

	// Add new import declarations for react and react-dom if needed
	if ( reactImports.length > 0 ) {
		const reactImportDeclaration = j.importDeclaration(
			reactImports,
			j.literal( 'react' )
		);
		root.get().node.program.body.unshift( reactImportDeclaration );
	}

	if ( reactDomImports.length > 0 ) {
		const reactDomImportDeclaration = j.importDeclaration(
			reactDomImports,
			j.literal( 'react-dom' )
		);
		root.get().node.program.body.unshift( reactDomImportDeclaration );
	}

	return root.toSource();
}
