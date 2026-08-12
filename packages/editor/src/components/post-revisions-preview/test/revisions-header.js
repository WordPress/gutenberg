import { hasChangesToRestore } from '../revisions-header';

const post = {
	content: '<!-- wp:paragraph --><p>Saved</p><!-- /wp:paragraph -->',
	title: 'Saved title',
	excerpt: 'Saved excerpt',
	meta: {
		footnotes: '[]',
		unrelated: 'value',
		_crdt_document: '{"document":"AAAV46m","updateId":151275664}',
	},
};

function getRevision( overrides = {} ) {
	return {
		id: 2,
		content: { raw: post.content },
		title: { raw: post.title },
		excerpt: { raw: post.excerpt },
		...overrides,
	};
}

describe( 'hasChangesToRestore', () => {
	it( 'returns false while the revision is still loading', () => {
		expect( hasChangesToRestore( null, post ) ).toBe( false );
	} );

	it( 'returns false for a revision matching the saved post', () => {
		expect( hasChangesToRestore( getRevision(), post ) ).toBe( false );
	} );

	it( 'returns true when the content differs', () => {
		const revision = getRevision( { content: { raw: 'Something else' } } );

		expect( hasChangesToRestore( revision, post ) ).toBe( true );
	} );

	it( 'returns true when the title differs', () => {
		const revision = getRevision( { title: { raw: 'Older title' } } );

		expect( hasChangesToRestore( revision, post ) ).toBe( true );
	} );

	it( 'returns true when the excerpt differs', () => {
		const revision = getRevision( { excerpt: { raw: 'Older excerpt' } } );

		expect( hasChangesToRestore( revision, post ) ).toBe( true );
	} );

	it( 'ignores title and excerpt the revision does not carry', () => {
		const revision = getRevision( {
			title: undefined,
			excerpt: undefined,
		} );

		expect( hasChangesToRestore( revision, post ) ).toBe( false );
	} );

	it( 'returns true when meta the revision carries differs', () => {
		const revision = getRevision( { meta: { footnotes: '[{"id":"a"}]' } } );

		expect( hasChangesToRestore( revision, post ) ).toBe( true );
	} );

	it( 'returns false when meta the revision carries matches', () => {
		const revision = getRevision( { meta: { footnotes: '[]' } } );

		expect( hasChangesToRestore( revision, post ) ).toBe( false );
	} );

	it( 'ignores post meta the revision does not carry', () => {
		const revision = getRevision( { meta: {} } );

		expect( hasChangesToRestore( revision, post ) ).toBe( false );
	} );

	it( 'ignores protected meta the revision stores empty', () => {
		// Revisions save `_crdt_document` empty, so it differs from the post on
		// every revision and must not count as a change to restore.
		const revision = getRevision( {
			meta: { footnotes: '[]', _crdt_document: '' },
		} );

		expect( hasChangesToRestore( revision, post ) ).toBe( false );
	} );
} );
