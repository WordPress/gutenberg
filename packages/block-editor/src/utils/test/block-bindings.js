/**
 * Internal dependencies
 */
import {
	getBlockBindingsContext,
	getInnerBlocksBinding,
	hasPatternOverridesDefaultBinding,
	replacePatternOverridesDefaultBinding,
} from '../block-bindings';

describe( 'getInnerBlocksBinding', () => {
	it( 'returns a pattern-overrides structural binding on a Core host', () => {
		expect(
			getInnerBlocksBinding(
				{
					metadata: {
						bindings: {
							innerBlocks: {
								source: 'core/pattern-overrides',
								args: { key: 'value' },
							},
						},
					},
				},
				'core/group'
			)
		).toEqual( {
			source: 'core/pattern-overrides',
			args: { key: 'value' },
		} );
	} );

	it( 'ignores missing or malformed descriptors', () => {
		expect( getInnerBlocksBinding( {}, 'core/group' ) ).toBeUndefined();
		expect(
			getInnerBlocksBinding(
				{ metadata: { bindings: { innerBlocks: { source: '' } } } },
				'core/group'
			)
		).toBeUndefined();
	} );

	it( 'excludes core/html until it has a single-area contract', () => {
		expect(
			getInnerBlocksBinding(
				{
					metadata: {
						bindings: {
							innerBlocks: {
								source: 'core/pattern-overrides',
							},
						},
					},
				},
				'core/html'
			)
		).toBeUndefined();
	} );

	it.each( [
		[ 'a custom source', 'core/group', 'test/source' ],
		[ 'a custom host', 'test/container', 'core/pattern-overrides' ],
	] )( 'excludes %s', ( _description, blockName, source ) => {
		expect(
			getInnerBlocksBinding(
				{
					metadata: {
						bindings: { innerBlocks: { source } },
					},
				},
				blockName
			)
		).toBeUndefined();
	} );
} );

describe( 'hasPatternOverridesDefaultBinding', () => {
	it( 'returns true when the `__default` binding targets pattern overrides', () => {
		expect(
			hasPatternOverridesDefaultBinding( {
				__default: { source: 'core/pattern-overrides' },
			} )
		).toBe( true );
	} );

	it( 'returns false when there is no `__default` binding', () => {
		expect(
			hasPatternOverridesDefaultBinding( {
				content: { source: 'core/pattern-overrides' },
			} )
		).toBe( false );
	} );

	it( 'returns false when the `__default` binding targets another source', () => {
		expect(
			hasPatternOverridesDefaultBinding( {
				__default: { source: 'core/post-meta' },
			} )
		).toBe( false );
	} );

	it( 'returns false for undefined bindings', () => {
		expect( hasPatternOverridesDefaultBinding( undefined ) ).toBe( false );
	} );
} );

describe( 'replacePatternOverridesDefaultBinding', () => {
	it( 'expands `__default` to a binding for each supported attribute', () => {
		const result = replacePatternOverridesDefaultBinding(
			{ __default: { source: 'core/pattern-overrides' } },
			[ 'content', 'url', 'alt' ]
		);

		expect( result ).toEqual( {
			content: { source: 'core/pattern-overrides' },
			url: { source: 'core/pattern-overrides' },
			alt: { source: 'core/pattern-overrides' },
		} );
	} );

	it( 'retains explicit non-pattern-override bindings while expanding `__default`', () => {
		const result = replacePatternOverridesDefaultBinding(
			{
				__default: { source: 'core/pattern-overrides' },
				url: { source: 'core/post-meta', args: { key: 'my_url' } },
			},
			[ 'content', 'url' ]
		);

		expect( result ).toEqual( {
			content: { source: 'core/pattern-overrides' },
			url: { source: 'core/post-meta', args: { key: 'my_url' } },
		} );
	} );

	it( 'returns the bindings untouched when there is no `__default` pattern-override binding', () => {
		const bindings = { content: { source: 'core/pattern-overrides' } };

		expect(
			replacePatternOverridesDefaultBinding( bindings, [ 'content' ] )
		).toBe( bindings );
	} );

	// Regression guard: the `__default` expansion only iterates the block
	// type's supported *attributes*, so it can never synthesize an
	// `innerBlocks` binding. Existing `__default` pattern-override blocks
	// must not implicitly gain an inner-block binding.
	it( 'never synthesizes an `innerBlocks` binding when expanding `__default`', () => {
		// A realistic set of supported *attribute* names — `innerBlocks` is not
		// an attribute and is therefore never present here.
		const supportedAttributes = [ 'content', 'url', 'alt', 'title' ];

		const result = replacePatternOverridesDefaultBinding(
			{ __default: { source: 'core/pattern-overrides' } },
			supportedAttributes
		);

		// Every produced binding key corresponds to a supported attribute…
		expect( Object.keys( result ) ).toEqual( supportedAttributes );
		// …and `innerBlocks` is never among them.
		expect( result ).not.toHaveProperty( 'innerBlocks' );
	} );

	it( 'does not add an `innerBlocks` binding even when supportedAttributes is empty', () => {
		const result = replacePatternOverridesDefaultBinding(
			{ __default: { source: 'core/pattern-overrides' } },
			[]
		);

		expect( result ).toEqual( {} );
		expect( result ).not.toHaveProperty( 'innerBlocks' );
	} );
} );

describe( 'getBlockBindingsContext', () => {
	const blockContext = {
		postId: 1,
		postType: 'post',
		'pattern/overrides': { content: 'x' },
	};

	it( 'copies the block-type-declared entries present in the block context', () => {
		expect(
			getBlockBindingsContext(
				blockContext,
				[ 'postId', 'postType' ],
				undefined
			)
		).toEqual( { postId: 1, postType: 'post' } );
	} );

	it( 'omits block-type-declared keys absent from the block context', () => {
		const result = getBlockBindingsContext(
			blockContext,
			[ 'postId', 'core/missing' ],
			undefined
		);

		expect( result ).toEqual( { postId: 1 } );
		// The declared-but-unprovided key must not become an own
		// (undefined-valued) key, so `key in context` checks stay meaningful.
		expect( result ).not.toHaveProperty( 'core/missing' );
	} );

	it( 'adds source-declared entries present in the block context', () => {
		expect(
			getBlockBindingsContext(
				blockContext,
				[ 'postId' ],
				[
					{ usesContext: [ 'pattern/overrides' ] },
					{ usesContext: [ 'postType' ] },
				]
			)
		).toEqual( {
			postId: 1,
			postType: 'post',
			'pattern/overrides': { content: 'x' },
		} );
	} );

	it( 'omits source-declared keys absent from the block context', () => {
		const result = getBlockBindingsContext( blockContext, undefined, [
			{ usesContext: [ 'core/missing' ] },
		] );

		expect( result ).toEqual( {} );
		expect( result ).not.toHaveProperty( 'core/missing' );
	} );

	it( 'ignores unregistered (undefined) sources and sources without usesContext', () => {
		expect(
			getBlockBindingsContext( blockContext, undefined, [
				undefined,
				{},
				{ usesContext: [ 'postId' ] },
			] )
		).toEqual( { postId: 1 } );
	} );

	it( 'returns a stable empty object when nothing is declared', () => {
		const first = getBlockBindingsContext( blockContext, undefined, [] );
		const second = getBlockBindingsContext( blockContext, [], undefined );

		expect( first ).toEqual( {} );
		expect( second ).toBe( first );
	} );
} );
