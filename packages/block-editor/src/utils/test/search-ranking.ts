import { describe, expect, it } from 'vitest';
import { getNormalizedSearchTerms, searchItems } from '../search-ranking';

describe( 'getNormalizedSearchTerms', () => {
	it( 'should return an empty array when no words detected', () => {
		expect( getNormalizedSearchTerms( ' - !? *** ' ) ).toEqual( [] );
	} );

	it( 'should remove diacritics', () => {
		expect( getNormalizedSearchTerms( 'média' ) ).toEqual( [ 'media' ] );
	} );

	it( 'should trim whitespace', () => {
		expect( getNormalizedSearchTerms( '  média  ' ) ).toEqual( [
			'media',
		] );
	} );

	it( 'should convert to lowercase', () => {
		expect( getNormalizedSearchTerms( '  Média  ' ) ).toEqual( [
			'media',
		] );
	} );

	it( 'should extract only words', () => {
		expect(
			getNormalizedSearchTerms( '  Média  &   Text Tag-Cloud > 123' )
		).toEqual( [ 'media', 'text', 'tag', 'cloud', '123' ] );
	} );

	it( 'should support non-latin letters', () => {
		expect( getNormalizedSearchTerms( 'მედია' ) ).toEqual( [ 'მედია' ] );
		expect(
			getNormalizedSearchTerms( '师父领进门，修行在个人。' )
		).toEqual( [ '师父领进门', '修行在个人' ] );
		expect(
			getNormalizedSearchTerms( 'Бързата работа – срам за майстора.' )
		).toEqual( [ 'бързата', 'работа', 'срам', 'за', 'маистора' ] );
		expect(
			getNormalizedSearchTerms( 'Cảm ơn sự giúp đỡ của bạn.' )
		).toEqual( [ 'cam', 'on', 'su', 'giup', 'do', 'cua', 'ban' ] );
	} );
} );

describe( 'searchItems', () => {
	describe( 'matching', () => {
		it( 'should return the list unchanged when no terms are detected', () => {
			const items = [ { title: 'Button' }, { title: 'Image' } ];
			expect( searchItems( items, ' - ? * ' ) ).toBe( items );
		} );

		it( 'should drop items that do not match', () => {
			const items = [ { title: 'Button' }, { title: 'Image' } ];
			expect( searchItems( items, 'image' ) ).toEqual( [ items[ 1 ] ] );
		} );

		it( 'should match every term across separate fields', () => {
			const item = {
				title: 'YouTube',
				name: 'core/embed',
				keywords: [ 'video' ],
			};
			expect( searchItems( [ item ], 'youtube embed video' ) ).toEqual( [
				item,
			] );
		} );

		it( 'should not match when a single term is missing', () => {
			const item = { title: 'YouTube', keywords: [ 'video' ] };
			expect( searchItems( [ item ], 'youtube pdf' ) ).toEqual( [] );
		} );

		it( 'should ignore a leading slash on the search term', () => {
			const items = [ { title: 'Media' } ];
			expect( searchItems( items, '/media' ) ).toEqual( items );
		} );

		it( 'should find word boundaries in non-latin titles', () => {
			const items = [ { title: 'Заглавие Циклы' } ];
			expect( searchItems( items, 'циклы' ) ).toEqual( items );
		} );
	} );

	describe( 'ranking', () => {
		it( 'should order by tier before anything else', () => {
			const equal = { title: 'Loop' };
			const startsWith = { title: 'Loop Of Posts' };
			const wordStartsWith = { title: 'Query Loop' };
			const contains = { title: 'Backloop' };

			expect(
				searchItems(
					[ contains, wordStartsWith, startsWith, equal ],
					'loop'
				)
			).toEqual( [ equal, startsWith, wordStartsWith, contains ] );
		} );

		it( 'should rank a term-only match below every phrase tier', () => {
			const equal = { title: 'Query Loop' };
			const startsWith = { title: 'Query Loop Extra' };
			// No single field holds the phrase, but both terms are present.
			const termsOnly = { title: 'Loop', keywords: [ 'query' ] };

			expect(
				searchItems( [ termsOnly, startsWith, equal ], 'query loop' )
			).toEqual( [ equal, startsWith, termsOnly ] );
		} );

		it( 'should prefer earlier matches within a tier', () => {
			// Both match on a word that starts with the term, so only how far
			// into the title that word sits separates them.
			const early = { title: 'Query Loop Extra' };
			const late = { title: 'A Query Of Posts Loop' };

			expect( searchItems( [ late, early ], 'loop' ) ).toEqual( [
				early,
				late,
			] );
		} );

		it( 'should not penalize longer titles that start with the search phrase', () => {
			const long = { title: 'Coffee Roasting Guide For Beginners' };
			const short = { title: 'Our Coffee' };

			expect( searchItems( [ short, long ], 'coffee' ) ).toEqual( [
				long,
				short,
			] );
		} );

		it( 'should cap a secondary field so it cannot outrank a weaker title match', () => {
			// Without the cap the exact description match would win outright.
			const titleWordMatch = { title: 'Query Loop' };
			const descriptionExact = { title: 'Posts', description: 'Loop' };

			expect(
				searchItems( [ descriptionExact, titleWordMatch ], 'loop' )
			).toEqual( [ titleWordMatch, descriptionExact ] );
		} );

		it( 'should break a tie by field priority', () => {
			// Both match at the same tier and the same position, so only the
			// field they matched in separates them.
			const viaTitle = { title: 'Backloop' };
			const viaDescription = { title: 'Posts', description: 'Backloop' };

			expect(
				searchItems( [ viaDescription, viaTitle ], 'loop' )
			).toEqual( [ viaTitle, viaDescription ] );
		} );
	} );

	describe( 'options', () => {
		it( 'should apply the filter before ranking', () => {
			const items = [
				{ title: 'Button', category: 'a' },
				{ title: 'Button', category: 'b' },
			];

			expect(
				searchItems( items, 'button', {
					filter: ( item ) => item.category === 'b',
				} )
			).toEqual( [ items[ 1 ] ] );
		} );

		it( 'should apply the filter when there is nothing to rank', () => {
			const items = [ { title: 'Button' }, { title: 'Image' } ];

			expect(
				searchItems( items, '', {
					filter: ( item ) => item.title === 'Image',
				} )
			).toEqual( [ items[ 1 ] ] );
		} );

		it( 'should rank only the fields it is given', () => {
			const item = { title: 'Posts', description: 'Loop' };

			expect(
				searchItems( [ item ], 'loop', {
					fields: [ { get: ( { title } ) => title } ],
				} )
			).toEqual( [] );
		} );

		it( 'should use the tiebreak only when rank, field and closeness all tie', () => {
			const a = { title: 'Query Loop', priority: 0 };
			const b = { title: 'Query Loop', priority: 1 };

			expect(
				searchItems( [ a, b ], 'loop', {
					tiebreak: ( one, two ) => two.priority - one.priority,
				} )
			).toEqual( [ b, a ] );
		} );

		it( 'should not let the tiebreak promote a weaker match', () => {
			const weak = { title: 'Query Loop', priority: 99 };
			const strong = { title: 'Loop', priority: 0 };

			expect(
				searchItems( [ weak, strong ], 'loop', {
					tiebreak: ( one, two ) => two.priority - one.priority,
				} )
			).toEqual( [ strong, weak ] );
		} );
	} );
} );
