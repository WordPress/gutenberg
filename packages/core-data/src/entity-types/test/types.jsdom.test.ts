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
import type {
	DefaultContextOf,
	EntityRecordOf,
	EntityRecordOfQuery,
} from '../index';
import type { Context, ContextualField, OmitNevers } from '../helpers';
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

/**
 * A plugin record with a field only the edit context serialises, so the
 * context it resolves to is observable rather than nominal.
 */
type Coupon< C extends Context > = OmitNevers< {
	id: number;
	code: string;
	secret: ContextualField< string, 'edit', C >;
	context?: C;
} >;

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
		myShop: { order: Order< C >; coupon: Coupon< C > };
	}

	// The same shape for the context each pair is fetched in. `product`
	// declares one; `order` deliberately does not, so it exercises the
	// fallback.
	interface PostTypeEntityContexts {
		product: 'edit';
	}
	interface EntityContextDefaults {
		myShop: { coupon: 'view' };
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

	describe( 'a union of query shapes resolves each member separately', () => {
		/*
		 * `keyof` over a union is the intersection of its keys, so a query
		 * that only carries `context` on one member would otherwise look as
		 * though it carries none and fall back to `edit`.
		 */
		() => {
			true satisfies Expect<
				EntityRecordOfQuery<
					'postType',
					'post',
					{ context: 'view' } | { per_page: number }
				>,
				Post< 'view' > | Post< 'edit' >
			>;
			true satisfies Expect<
				EntityRecordOfQuery<
					'postType',
					'post',
					{ context: 'view' } | { context: 'embed' }
				>,
				Post< 'view' > | Post< 'embed' >
			>;
		};

		// The same shape through the public selectors.
		( query: { context: 'view' } | { per_page: number } ) => {
			const record = select( coreStore ).getEntityRecord(
				'postType',
				'post',
				1,
				query
			);
			true satisfies Expect<
				typeof record,
				Post< 'view' > | Post< 'edit' > | undefined
			>;
			// @ts-expect-error -- the request may be `view`, which omits it.
			record?.password;

			const records = select( coreStore ).getEntityRecords(
				'postType',
				'post',
				query
			);
			true satisfies Expect<
				typeof records,
				( Post< 'view' > | Post< 'edit' > )[] | null
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

	describe( 'the inferred content field matches the REST schema', () => {
		() => {
			/*
			 * The map makes `Post` and `Page` the default result for these
			 * pairs, so their fields are now what a consumer reads without
			 * naming a type. Core serialises `content.protected` as a boolean
			 * and `content.block_version` as an integer, the latter only in
			 * the edit context.
			 */
			const post = select( coreStore ).getEntityRecord(
				'postType',
				'post',
				1
			);
			post?.content.protected satisfies boolean | undefined;
			post?.content.block_version satisfies number | undefined;
			// @ts-expect-error -- Core serialises `protected`, not `is_protected`.
			post?.content.is_protected;

			const page = select( coreStore ).getEntityRecord(
				'postType',
				'page',
				1
			);
			page?.content.protected satisfies boolean | undefined;
			page?.content.block_version satisfies number | undefined;
			// @ts-expect-error -- Core serialises `protected`, not `is_protected`.
			page?.content.is_protected;

			// `block_version` is edit-only, so a view request drops it.
			const viewPost = select( coreStore ).getEntityRecord(
				'postType',
				'post',
				1,
				{ context: 'view' }
			);
			viewPost?.content.protected satisfies boolean | undefined;
			// @ts-expect-error -- `block_version` is edit-only, so a view
			// record drops it.
			viewPost?.content.block_version;
		};
	} );

	describe( 'the template field follows the REST schema', () => {
		() => {
			/*
			 * The posts controller registers `template` outside the supports
			 * loop, so it is on every post type in the view and edit
			 * contexts. Neither `WP_REST_Blocks_Controller` nor
			 * `WP_Navigation_Fallback` removes it.
			 */
			const pattern = select( coreStore ).getEntityRecord(
				'postType',
				'wp_block',
				1
			);
			pattern?.template satisfies string | undefined;

			const navigation = select( coreStore ).getEntityRecord(
				'postType',
				'wp_navigation',
				1
			);
			navigation?.template satisfies string | undefined;

			const viewNavigation = select( coreStore ).getEntityRecord(
				'postType',
				'wp_navigation',
				1,
				{ context: 'view' }
			);
			viewNavigation?.template satisfies string | undefined;

			// `template` is out of the embed context, which the navigation
			// fallback does not widen.
			const embedNavigation = select( coreStore ).getEntityRecord(
				'postType',
				'wp_navigation',
				1,
				{ context: 'embed' }
			);
			// @ts-expect-error -- `template` is view- and edit-only.
			embedNavigation?.template;
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
			// @ts-expect-error -- `password` is edit-only.
			inline?.password;
			// @ts-expect-error -- `raw` is edit-only, so a view record omits it.
			inline?.title.raw;
			// `rendered` is serialised in every context.
			inline?.title.rendered satisfies string | undefined;

			/*
			 * The promised list, which nothing else reaches:
			 * `PromiseCurriedSignature` is declared separately from
			 * `CurriedSignature`, so it can regress to the edit context on its
			 * own while every other assertion here stays green.
			 */
			const promisedList = await resolveSelect(
				coreStore
			).getEntityRecords( 'postType', 'post', { context: 'view' } );
			true satisfies Expect<
				typeof promisedList,
				Post< 'view' >[] | null
			>;
			// @ts-expect-error -- `password` is edit-only.
			promisedList?.[ 0 ].password;
			// @ts-expect-error -- `raw` is edit-only, so a view record omits it.
			promisedList?.[ 0 ].title.raw;
			// `rendered` is serialised in every context.
			promisedList?.[ 0 ].title.rendered satisfies string | undefined;

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
			 * `raw` is dropped from the contexts that do not serialise it, so
			 * it is absent from the union rather than surviving as `never` and
			 * collapsing back to `string`.
			 */
			// @ts-expect-error -- the request may be `view`, which omits `raw`.
			reused?.title.raw;
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

			const promisedReused = await resolveSelect(
				coreStore
			).getEntityRecords( 'postType', 'post', query );
			true satisfies Expect<
				typeof promisedReused,
				PostInAnyContext[] | null
			>;
			// @ts-expect-error -- the request may be `view`, which omits `raw`.
			promisedReused?.[ 0 ].title.raw;
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

	describe( 'a call with no query uses the context the entity is fetched in', () => {
		() => {
			/*
			 * Most entities are registered with `context: 'edit'`, but a few
			 * are not, and `__unstableBase` sends no `context` at all so the
			 * server applies its own default of `view`.
			 */
			true satisfies Expect<
				DefaultContextOf< 'postType', 'post' >,
				'edit'
			>;
			true satisfies Expect<
				DefaultContextOf< 'taxonomy', 'category' >,
				'edit'
			>;
			true satisfies Expect<
				DefaultContextOf< 'root', 'comment' >,
				'edit'
			>;
			true satisfies Expect<
				DefaultContextOf< 'root', '__unstableBase' >,
				'view'
			>;
			true satisfies Expect<
				DefaultContextOf< 'root', 'fontCollection' >,
				'view'
			>;
			true satisfies Expect< DefaultContextOf< 'root', 'icon' >, 'view' >;

			// The default reaches the selectors, so a view-default entity is
			// not typed with the edit record.
			const base = select( coreStore ).getEntityRecord(
				'root',
				'__unstableBase'
			);
			true satisfies Expect< typeof base, Base< 'view' > | undefined >;

			// Naming a context still wins over the default.
			const editBase = select( coreStore ).getEntityRecord(
				'root',
				'__unstableBase',
				undefined,
				{ context: 'edit' }
			);
			true satisfies Expect<
				typeof editBase,
				Base< 'edit' > | undefined
			>;
		};
	} );

	describe( 'a plugin declares the context its entity is fetched in', () => {
		() => {
			// A pair that declares `view` resolves to the view record, so the
			// edit-only field is unreadable without asking for `edit`.
			true satisfies Expect<
				DefaultContextOf< 'myShop', 'coupon' >,
				'view'
			>;
			const coupon = select( coreStore ).getEntityRecord(
				'myShop',
				'coupon',
				1
			);
			true satisfies Expect<
				typeof coupon,
				Coupon< 'view' > | undefined
			>;
			coupon?.code satisfies string | undefined;
			// @ts-expect-error -- `secret` is edit-only, so a view record omits it.
			coupon?.secret;

			const editCoupon = select( coreStore ).getEntityRecord(
				'myShop',
				'coupon',
				1,
				{ context: 'edit' }
			);
			editCoupon?.secret satisfies string | undefined;

			/*
			 * A pair that declares nothing resolves to every context, which is
			 * the conservative answer: the entity is registered at runtime, so
			 * its `baseURLParams` are not knowable from the type alone.
			 */
			true satisfies Expect<
				DefaultContextOf< 'myShop', 'order' >,
				Context
			>;
			const order = select( coreStore ).getEntityRecord(
				'myShop',
				'order',
				1
			);
			true satisfies Expect<
				typeof order,
				Order< 'view' > | Order< 'edit' > | Order< 'embed' > | undefined
			>;
			order?.total satisfies string | undefined;
		};
	} );
} );

/* eslint-enable no-unused-expressions */
/* eslint-enable @typescript-eslint/no-unused-vars */
