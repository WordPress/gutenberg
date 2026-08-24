/**
 * Tests that a plugin can extend the `kind`/`name` map.
 *
 * The augmentations below are program-global: every name declared here is
 * visible to the rest of the type tests. They deliberately avoid the names
 * `entity-record-of.test.ts` asserts are unknown.
 */
import type { EntityRecordOf } from '../index';
import type { Context } from '../helpers';
import type { Term } from '../term';

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

declare module '../index' {
	/*
	 * A name added to a kind that already exists. Merging into
	 * `EntityRecordTypes` itself would fail with TS2717, because merged
	 * interface properties have to have identical types.
	 */
	interface PostTypeEntityRecordTypes< C extends Context > {
		product: Product< C >;
	}
	interface TaxonomyEntityRecordTypes< C extends Context > {
		genre: Term< C >;
	}
	/*
	 * A whole new kind, which merges into the top level as before.
	 */
	interface EntityRecordTypes< C extends Context > {
		myShop: { order: Order< C > };
	}
}

type Expect< A, B > = [ A ] extends [ B ]
	? [ B ] extends [ A ]
		? true
		: never
	: never;

describe( 'EntityRecordTypes augmentation', () => {
	it( 'resolves a custom post type added to an existing kind', () => {
		const product: Expect<
			EntityRecordOf< 'postType', 'product' >,
			Product< 'edit' >
		> = true;

		expect( product ).toBe( true );
	} );

	it( 'resolves a custom taxonomy added to an existing kind', () => {
		const genre: Expect<
			EntityRecordOf< 'taxonomy', 'genre' >,
			Term< 'edit' >
		> = true;

		expect( genre ).toBe( true );
	} );

	it( 'resolves a name under a kind the plugin registered itself', () => {
		const order: Expect<
			EntityRecordOf< 'myShop', 'order' >,
			Order< 'edit' >
		> = true;

		expect( order ).toBe( true );
	} );

	it( 'keeps the built-in names of an augmented kind', () => {
		const post: EntityRecordOf< 'postType', 'post' > | undefined =
			undefined;

		expect( post ).toBeUndefined();
	} );
} );
