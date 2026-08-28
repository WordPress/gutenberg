/**
 * Compile-time tests for the `kind`/`name` record map and the selectors built
 * on it.
 *
 * The assertions here are types, not behaviour: each one lives in a function
 * that is never called, so a regression surfaces as a type error rather than a
 * failing run. Jest still needs one real test for the suite to report, which is
 * what `dummy test` is for -- the same shape `@wordpress/interactivity` uses in
 * `src/test/types.ts`.
 *
 * The selector cases go through `select()` and `resolveSelect()` rather than
 * instantiating `EntityRecordOfQuery` directly, so they exercise the overload
 * resolution and the curried signatures that consumers actually receive.
 */

/* eslint-disable no-unused-expressions -- the assertions below are expression statements. */
/* eslint-disable @typescript-eslint/no-unused-vars -- the values exist only so their inferred types can be asserted. */
import { select, resolveSelect } from '@wordpress/data';
import { store as coreStore } from '../../index';
import type { EntityRecordOf, EntityRecordOfQuery } from '../index';
import type { Context } from '../helpers';
import type { Attachment } from '../attachment';
import type { Base } from '../base';
import type { Comment } from '../comment';
import type { GlobalStyles } from '../global-styles';
import type { Block } from '../block';
import type { Navigation } from '../navigation';
import type { Page } from '../page';
import type { Post } from '../post';
import type { Settings } from '../settings';
import type { Term } from '../term';
import type { Type } from '../type';
import type { WpTemplate } from '../wp-template';
import type { WpTemplatePart } from '../wp-template-part';

/**
 * Resolves to `true` only when `A` and `B` are mutually assignable, so a
 * widened or narrowed type fails rather than passing silently. Used as
 * `true satisfies Expect< A, B >`, which fails to compile when the two differ
 * because `Expect` resolves to `never`.
 */
type Expect< A, B > = [ A ] extends [ B ]
	? [ B ] extends [ A ]
		? true
		: never
	: never;

/**
 * A post whose context is not known at compile time: one record per context,
 * leaving only the fields all three serialise readable.
 */
type PostInAnyContext = Post< 'view' > | Post< 'edit' > | Post< 'embed' >;

interface Product< C extends Context > {
	id: number;
	price: string;
	context?: C;
}

interface Order< C extends Context > {
	id: number;
	total: string;
	context?: C;
}

/*
 * These augmentations are program-global: every name declared here is visible
 * to the rest of the suite. They deliberately avoid the names asserted to be
 * unknown below.
 */
declare module '../index' {
	// A name added to a kind that already exists. Merging into
	// `EntityRecordTypes` itself would fail with TS2717, because merged
	// interface properties have to have identical types.
	interface PostTypeEntityRecordTypes< C extends Context > {
		product: Product< C >;
	}
	interface TaxonomyEntityRecordTypes< C extends Context > {
		genre: Term< C >;
	}
	// A whole new kind, which merges at the top level as before.
	interface EntityRecordTypes< C extends Context > {
		myShop: { order: Order< C > };
	}
}

describe( 'Entity record types', () => {
	it( 'dummy test', () => {
		expect( true ).toBe( true );
	} );

	describe( 'the map resolves root entities to their record type', () => {
		() => {
			true satisfies Expect<
				EntityRecordOf< 'root', '__unstableBase' >,
				Base< 'edit' >
			>;
			true satisfies Expect<
				EntityRecordOf< 'root', 'comment' >,
				Comment< 'edit' >
			>;
			true satisfies Expect<
				EntityRecordOf< 'root', 'postType' >,
				Type< 'edit' >
			>;
			true satisfies Expect<
				EntityRecordOf< 'root', 'site' >,
				Settings< 'edit' >
			>;
			// `root`/`globalStyles` returns a styles config, not the
			// `GlobalStylesRevision` it was previously paired with.
			true satisfies Expect<
				EntityRecordOf< 'root', 'globalStyles' >,
				GlobalStyles< 'edit' >
			>;
		};
	} );

	describe( 'the map resolves post types and taxonomies', () => {
		() => {
			true satisfies Expect<
				EntityRecordOf< 'postType', 'post' >,
				Post< 'edit' >
			>;
			true satisfies Expect<
				EntityRecordOf< 'postType', 'page' >,
				Page< 'edit' >
			>;
			true satisfies Expect<
				EntityRecordOf< 'postType', 'attachment' >,
				Attachment< 'edit' >
			>;
			true satisfies Expect<
				EntityRecordOf< 'postType', 'wp_block' >,
				Block< 'edit' >
			>;
			true satisfies Expect<
				EntityRecordOf< 'postType', 'wp_navigation' >,
				Navigation< 'edit' >
			>;
			true satisfies Expect<
				EntityRecordOf< 'postType', 'wp_template' >,
				WpTemplate< 'edit' >
			>;
			true satisfies Expect<
				EntityRecordOf< 'postType', 'wp_template_part' >,
				WpTemplatePart< 'edit' >
			>;
			true satisfies Expect<
				EntityRecordOf< 'taxonomy', 'category' >,
				Term< 'edit' >
			>;
		};
	} );

	describe( 'the map rejects pairs it does not know', () => {
		() => {
			type UnknownName = EntityRecordOf<
				'postType',
				// @ts-expect-error -- 'my_custom_type' is not a known post type.
				'my_custom_type'
			>;
			type UnknownKind = EntityRecordOf<
				// @ts-expect-error -- 'myPlugin' is not a known entity kind.
				'myPlugin',
				'order'
			>;
			const rejected: [ UnknownName?, UnknownKind? ] = [];
			rejected satisfies unknown[];
		};
	} );

	describe( 'a query resolves the record context', () => {
		() => {
			true satisfies Expect<
				EntityRecordOfQuery< 'postType', 'post', { context: 'view' } >,
				Post< 'view' >
			>;
			true satisfies Expect<
				EntityRecordOfQuery< 'postType', 'post', { context: 'embed' } >,
				Post< 'embed' >
			>;
			// A query with no `context` keeps the complete record.
			true satisfies Expect<
				EntityRecordOfQuery< 'postType', 'post', { per_page: 10 } >,
				Post< 'edit' >
			>;
			true satisfies Expect<
				EntityRecordOfQuery< 'postType', 'post', undefined >,
				Post< 'edit' >
			>;
		};
	} );

	describe( 'a query that does not pin the context down resolves to all of them', () => {
		() => {
			// A reusable object widens `context` to `string` at the
			// declaration. The request still goes out with the context the
			// object named, so `edit` cannot be assumed.
			true satisfies Expect<
				EntityRecordOfQuery< 'postType', 'post', { context: string } >,
				PostInAnyContext
			>;
			true satisfies Expect<
				EntityRecordOfQuery<
					'postType',
					'post',
					{ context?: 'view' | 'edit' | 'embed' }
				>,
				PostInAnyContext
			>;
			// The declared type of the selectors' own `query` parameter.
			true satisfies Expect<
				EntityRecordOfQuery<
					'postType',
					'post',
					Record< string, any >
				>,
				PostInAnyContext
			>;
			// Each context reaches the record separately: `ContextualField`
			// distributes over the contexts a field is available in, not over
			// `C`, so `Post< 'view' | 'embed' >` would carry the edit fields.
			true satisfies Expect<
				EntityRecordOfQuery<
					'postType',
					'post',
					{ context: 'view' | 'embed' }
				>,
				Post< 'view' > | Post< 'embed' >
			>;
		};
	} );

	describe( 'getEntityRecord infers the record through select()', () => {
		() => {
			const post = select( coreStore ).getEntityRecord(
				'postType',
				'post',
				1
			);
			true satisfies Expect< typeof post, Post< 'edit' > | undefined >;
			post?.title.raw satisfies string | undefined;
			post?.password satisfies string | undefined;

			const comment = select( coreStore ).getEntityRecord(
				'root',
				'comment',
				1
			);
			true satisfies Expect<
				typeof comment,
				Comment< 'edit' > | undefined
			>;
			// @ts-expect-error -- a comment has no `password`.
			comment?.password;
		};
	} );

	describe( 'getEntityRecords infers the record list through select()', () => {
		() => {
			const posts = select( coreStore ).getEntityRecords(
				'postType',
				'post'
			);
			true satisfies Expect< typeof posts, Post< 'edit' >[] | null >;
			posts?.[ 0 ].title.raw satisfies string | undefined;
		};
	} );

	describe( 'resolveSelect promises the same record', () => {
		async () => {
			const post = await resolveSelect( coreStore ).getEntityRecord(
				'postType',
				'post',
				1
			);
			true satisfies Expect< typeof post, Post< 'edit' > | undefined >;

			const posts = await resolveSelect( coreStore ).getEntityRecords(
				'postType',
				'post'
			);
			true satisfies Expect< typeof posts, Post< 'edit' >[] | null >;
		};
	} );

	describe( 'the selectors resolve the context from the query', () => {
		async () => {
			const inline = select( coreStore ).getEntityRecord(
				'postType',
				'post',
				1,
				{ context: 'view' }
			);
			true satisfies Expect< typeof inline, Post< 'view' > | undefined >;
			/*
			 * `password` is dropped from a view record, but `raw` is not:
			 * `OmitNevers` only recurses into a property whose type has an
			 * index signature, which `RenderedText` does not. It survives as
			 * `never`, so reading it compiles and yields nothing usable.
			 */
			// @ts-expect-error -- `password` is edit-only.
			inline?.password;
			true satisfies Expect<
				NonNullable< typeof inline >[ 'title' ][ 'raw' ],
				never
			>;

			// The reusable-object case, which is what regressed before.
			const query = { context: 'view' };
			const reused = select( coreStore ).getEntityRecord(
				'postType',
				'post',
				1,
				query
			);
			true satisfies Expect<
				typeof reused,
				PostInAnyContext | undefined
			>;
			// @ts-expect-error -- `password` is edit-only, so it is unreadable.
			reused?.password;
			/*
			 * `RenderedText` has always modelled `raw` as `never` outside
			 * `edit` rather than removing it, so `never | string` collapses to
			 * `string` across the union and `title.raw` stays readable. That
			 * is how contextual fields nested in an interface have always
			 * behaved; asserted here so a change to it is deliberate.
			 */
			true satisfies Expect<
				NonNullable< typeof reused >[ 'title' ][ 'raw' ],
				string
			>;
			// `rendered` is on every context, so it stays readable.
			reused?.title.rendered satisfies string | undefined;

			const plural = select( coreStore ).getEntityRecords(
				'postType',
				'post',
				query
			);
			true satisfies Expect< typeof plural, PostInAnyContext[] | null >;

			const promised = await resolveSelect( coreStore ).getEntityRecord(
				'postType',
				'post',
				1,
				query
			);
			true satisfies Expect<
				typeof promised,
				PostInAnyContext | undefined
			>;
		};
	} );

	describe( '`_fields` keeps the complete record', () => {
		() => {
			/*
			 * `_fields` is deliberately not modelled -- narrowing to the named
			 * fields makes the type rigid for a small number of call sites, and
			 * the useful shape there varies per consumer. A call site that
			 * wants the subset reflected says so locally. This asserts the
			 * current behaviour so a future change to it is deliberate.
			 */
			const post = select( coreStore ).getEntityRecord(
				'postType',
				'post',
				1,
				{ _fields: 'id,slug' }
			);
			true satisfies Expect< typeof post, Post< 'edit' > | undefined >;

			// `_fields` alongside a context still resolves the context.
			const view = select( coreStore ).getEntityRecord(
				'postType',
				'post',
				1,
				{ context: 'view', _fields: 'id,slug' }
			);
			true satisfies Expect< typeof view, Post< 'view' > | undefined >;
		};
	} );

	describe( 'an unknown pair falls back to the wider overload', () => {
		() => {
			// Entities registered at runtime are not in the map, so the
			// selector keeps resolving to the broad union rather than erroring.
			const record = select( coreStore ).getEntityRecord(
				'myPlugin',
				'order',
				1
			);
			// @ts-expect-error -- the union has no `password` on every member.
			record?.password;

			// The explicit generic is still honoured for those call sites.
			const typed = select( coreStore ).getEntityRecord< Post< 'edit' > >(
				'myPlugin',
				'order',
				1
			);
			true satisfies Expect< typeof typed, Post< 'edit' > | undefined >;
		};
	} );

	describe( 'a plugin can extend the map', () => {
		() => {
			// A name added to a kind that already exists.
			true satisfies Expect<
				EntityRecordOf< 'postType', 'product' >,
				Product< 'edit' >
			>;
			true satisfies Expect<
				EntityRecordOf< 'taxonomy', 'genre' >,
				Term< 'edit' >
			>;
			// A name under a kind the plugin registered itself.
			true satisfies Expect<
				EntityRecordOf< 'myShop', 'order' >,
				Order< 'edit' >
			>;
			// The built-in names of an augmented kind still resolve.
			true satisfies Expect<
				EntityRecordOf< 'postType', 'post' >,
				Post< 'edit' >
			>;

			// The augmentation reaches the selectors, not just the map.
			const product = select( coreStore ).getEntityRecord(
				'postType',
				'product',
				1
			);
			true satisfies Expect<
				typeof product,
				Product< 'edit' > | undefined
			>;
			product?.price satisfies string | undefined;
		};
	} );
} );

/* eslint-enable no-unused-expressions */
/* eslint-enable @typescript-eslint/no-unused-vars */
