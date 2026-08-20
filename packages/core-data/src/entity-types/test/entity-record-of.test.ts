/**
 * Tests for the `kind`/`name` to record type map.
 *
 * These assertions are mostly compile-time: `Expect` fails to typecheck unless
 * the two types are mutually assignable, so a regression in the map surfaces as
 * a type error rather than a failing assertion. The runtime expectation exists
 * so the suite reports a result.
 */
import type { EntityRecordOf, EntityRecordOfQuery } from '../index';
import type { Attachment } from '../attachment';
import type { Base } from '../base';
import type { Comment } from '../comment';
import type { GlobalStyles } from '../global-styles';
import type { WpBlock } from '../wp-block';
import type { WpNavigation } from '../wp-navigation';
import type { Page } from '../page';
import type { Post } from '../post';
import type { Settings } from '../settings';
import type { Term } from '../term';
import type { Type } from '../type';
import type { WpTemplate } from '../wp-template';
import type { WpTemplatePart } from '../wp-template-part';

/**
 * Resolves to `true` only when `A` and `B` are mutually assignable, so a
 * widened or narrowed mapping fails the assignment below rather than passing
 * silently.
 */
type Expect< A, B > = [ A ] extends [ B ]
	? [ B ] extends [ A ]
		? true
		: never
	: never;

describe( 'EntityRecordOf', () => {
	it( 'resolves root entities to their record type', () => {
		const base: Expect<
			EntityRecordOf< 'root', '__unstableBase' >,
			Base< 'edit' >
		> = true;
		const comment: Expect<
			EntityRecordOf< 'root', 'comment' >,
			Comment< 'edit' >
		> = true;
		const postType: Expect<
			EntityRecordOf< 'root', 'postType' >,
			Type< 'edit' >
		> = true;
		const site: Expect<
			EntityRecordOf< 'root', 'site' >,
			Settings< 'edit' >
		> = true;

		expect( [ base, comment, postType, site ] ).toHaveLength( 4 );
	} );

	it( 'resolves post types to their record type', () => {
		const post: Expect<
			EntityRecordOf< 'postType', 'post' >,
			Post< 'edit' >
		> = true;
		const page: Expect<
			EntityRecordOf< 'postType', 'page' >,
			Page< 'edit' >
		> = true;
		const attachment: Expect<
			EntityRecordOf< 'postType', 'attachment' >,
			Attachment< 'edit' >
		> = true;
		const template: Expect<
			EntityRecordOf< 'postType', 'wp_template' >,
			WpTemplate< 'edit' >
		> = true;
		const templatePart: Expect<
			EntityRecordOf< 'postType', 'wp_template_part' >,
			WpTemplatePart< 'edit' >
		> = true;
		const block: Expect<
			EntityRecordOf< 'postType', 'wp_block' >,
			WpBlock< 'edit' >
		> = true;
		const navigation: Expect<
			EntityRecordOf< 'postType', 'wp_navigation' >,
			WpNavigation< 'edit' >
		> = true;

		expect( [
			post,
			page,
			attachment,
			template,
			templatePart,
			block,
			navigation,
		] ).toHaveLength( 7 );
	} );

	it( 'resolves taxonomies to their record type', () => {
		const category: Expect<
			EntityRecordOf< 'taxonomy', 'category' >,
			Term< 'edit' >
		> = true;
		const postTag: Expect<
			EntityRecordOf< 'taxonomy', 'post_tag' >,
			Term< 'edit' >
		> = true;

		expect( [ category, postTag ] ).toHaveLength( 2 );
	} );

	it( 'honours the requested context', () => {
		const viewPost: Expect<
			EntityRecordOf< 'postType', 'post', 'view' >,
			Post< 'view' >
		> = true;

		expect( viewPost ).toBe( true );
	} );

	/*
	 * `context` decides which fields the REST API serialises, so a `view`
	 * request must not be typed with the edit-context fields.
	 *
	 * `_fields` is deliberately not modelled -- see `EntityRecordOfQuery`. A
	 * `_fields` query still resolves to the complete record, and narrowing to
	 * the requested subset is left to the call site.
	 */
	it( 'resolves the record context from the query', () => {
		const view: Expect<
			EntityRecordOfQuery< 'postType', 'post', { context: 'view' } >,
			Post< 'view' >
		> = true;
		const embed: Expect<
			EntityRecordOfQuery< 'postType', 'post', { context: 'embed' } >,
			Post< 'embed' >
		> = true;
		// A `_fields` query resolves the context and keeps the whole record.
		const withFields: Expect<
			EntityRecordOfQuery<
				'postType',
				'post',
				{ context: 'view'; _fields: 'id,slug' }
			>,
			Post< 'view' >
		> = true;

		expect( [ view, embed, withFields ] ).toHaveLength( 3 );
	} );

	it( 'leaves a query without a context at the complete record', () => {
		const otherQueryArgs: Expect<
			EntityRecordOfQuery< 'postType', 'post', { per_page: 10 } >,
			Post< 'edit' >
		> = true;
		const noQuery: Expect<
			EntityRecordOfQuery< 'postType', 'post', undefined >,
			Post< 'edit' >
		> = true;

		expect( [ otherQueryArgs, noQuery ] ).toHaveLength( 2 );
	} );

	/*
	 * `root`/`globalStyles` returns a styles config, so it maps to
	 * `GlobalStyles` -- not the `GlobalStylesRevision` that
	 * `dynamic-entities.ts` pairs it with, which comes from a separate
	 * endpoint and carries revision metadata the record does not have.
	 */
	it( 'maps globalStyles to the config, not the revision', () => {
		const config: Expect<
			EntityRecordOf< 'root', 'globalStyles' >,
			GlobalStyles< 'edit' >
		> = true;

		expect( config ).toBe( true );
	} );

	/*
	 * The map only covers pairs it knows. Entities registered at runtime are
	 * handled by the selectors falling through to their wider overload, which
	 * `selectors.test.ts` covers -- not by widening this type.
	 */
	it( 'rejects pairs it does not know', () => {
		// @ts-expect-error -- 'my_custom_type' is not a known post type.
		type UnknownName = EntityRecordOf< 'postType', 'my_custom_type' >;
		// @ts-expect-error -- 'myPlugin' is not a known entity kind.
		type UnknownKind = EntityRecordOf< 'myPlugin', 'order' >;

		const rejected: [ UnknownName?, UnknownKind? ] = [];
		expect( rejected ).toHaveLength( 0 );
	} );
} );
