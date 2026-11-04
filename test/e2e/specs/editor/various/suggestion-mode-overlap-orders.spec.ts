/**
 * Every shared overlap fixture, seeded through REST and resolved through the
 * sidebar in many orders: after each decision the canvas must show what the
 * oracle says, an outdated suggestion's markers must be gone, and the saved
 * post must publish the oracle's text.
 *
 * The orders come from the data the oracle generates for each fixture: every
 * order for a fixture of three suggestions, a seeded sample of 24 above that.
 *
 * - `OVERLAP_FIXTURE=four-same-kind` runs one fixture.
 * - `OVERLAP_ORDERS=all` runs every stored order; a number runs that many per
 *   fixture. By default annezazu runs every order and the others eight each.
 * - `OVERLAP_PHASES=A` runs fixtures of a phase that has not landed yet.
 */
import { test, expect } from '@wordpress/e2e-test-utils-playwright';
import {
	createOverlapUsers,
	decideSuggestion,
	firstBlockHTML,
	isPhaseLanded,
	loadOverlapFixtures,
	openNotesSidebar,
	renderOverlapHTML,
	seedOverlapFixture,
} from './suggestion-mode-overlap-utils';

const DEFAULT_ORDERS = 8;

const fixtures = loadOverlapFixtures().filter(
	( fixture ) =>
		! process.env.OVERLAP_FIXTURE ||
		fixture.name === process.env.OVERLAP_FIXTURE
);

function ordersOf( fixture: ( typeof fixtures )[ number ] ) {
	const { list } = fixture.orders;
	const wanted = process.env.OVERLAP_ORDERS;
	if ( wanted === 'all' || ( ! wanted && fixture.name === 'annezazu' ) ) {
		return list;
	}
	return list.slice( 0, wanted ? Number( wanted ) : DEFAULT_ORDERS );
}

test.describe( 'Suggestion mode: overlapping suggestions in every order', () => {
	let userIds: Record< string, number > = {};

	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [
			'gutenberg-suggestion-mode',
		] );
		userIds = await createOverlapUsers( requestUtils );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllComments( 'note' );
		await requestUtils.deleteAllPosts();
		await requestUtils.deleteAllUsers();
		await requestUtils.setGutenbergExperiments( [] );
	} );

	for ( const fixture of fixtures ) {
		test.describe( `${ fixture.name } (phase ${ fixture.phase })`, () => {
			test.skip(
				! isPhaseLanded( fixture.phase ),
				`Phase ${ fixture.phase } of the overlap plan has not landed.`
			);

			for ( const order of ordersOf( fixture ) ) {
				test(
					order.label,
					async ( { admin, page, editor, requestUtils } ) => {
						const { postId, ids } = await seedOverlapFixture(
							requestUtils,
							fixture,
							userIds
						);
						await admin.editPost( postId );
						const sidebar = await openNotesSidebar( page );

						expect(
							renderOverlapHTML( await firstBlockHTML( page ) )
						).toBe( fixture.views.displayed );
						const decided: string[] = [];
						for ( const step of order.steps ) {
							await decideSuggestion(
								page,
								sidebar,
								ids[ step.key ],
								step.decision
							);
							decided.push( step.key );
							await expect
								.poll( async () =>
									renderOverlapHTML(
										await firstBlockHTML( page )
									)
								)
								.toBe( step.displayed );
							// A decided or outdated suggestion leaves no
							// marker behind.
							for ( const key of [
								...decided,
								...step.outdated,
							] ) {
								await expect(
									editor.canvas.locator(
										`mark[data-suggestion-id="${ ids[ key ] }"]`
									)
								).toHaveCount( 0 );
							}
						}

						await editor.saveDraft();
						const saved = await requestUtils.rest( {
							path: `/wp/v2/posts/${ postId }`,
						} );
						expect(
							renderOverlapHTML( saved.content.rendered.trim() )
						).toBe( order.published );
						for ( const step of order.steps ) {
							const note = await requestUtils.rest( {
								path: `/wp/v2/comments/${ ids[ step.key ] }`,
								params: { context: 'edit' },
							} );
							expect( note.meta._wp_suggestion_status ).toBe(
								step.decision === 'accept'
									? 'applied'
									: 'rejected'
							);
						}
					}
				);
			}
		} );
	}
} );
