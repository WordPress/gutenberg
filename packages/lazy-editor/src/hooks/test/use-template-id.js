import { renderHook } from '@testing-library/react';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useTemplateId } from '../use-template-id';

function createRegistryWithTemplates() {
	const registry = createRegistry();
	registry.register( coreStore );
	const { receiveEntityRecords, addEntities } =
		registry.dispatch( coreStore );

	// A static front page makes home page resolution synchronous.
	receiveEntityRecords( 'root', '__unstableBase', {
		show_on_front: 'page',
		page_on_front: 2,
	} );
	addEntities( [
		{ kind: 'postType', name: 'wp_template', baseURL: '/wp/v2/templates' },
	] );
	receiveEntityRecords(
		'postType',
		'wp_template',
		[ { id: 'theme//custom', slug: 'custom' } ],
		{ per_page: -1 }
	);
	return registry;
}

/**
 * Seeds an entity that has a template assigned, which is the branch of the
 * resolution that does not depend on how the template hierarchy builds its
 * fallback slugs. The attachment test below resolves an identically shaped
 * entity, so it doubles as proof that these seeds would otherwise resolve.
 *
 * @param {Object}        registry Registry to seed.
 * @param {string}        postType Post type of the record.
 * @param {string|number} postId   ID of the record.
 */
function seedEntityWithAssignedTemplate( registry, postType, postId ) {
	const { receiveEntityRecords, addEntities } =
		registry.dispatch( coreStore );
	addEntities( [
		{ kind: 'postType', name: postType, baseURL: `/wp/v2/${ postType }` },
	] );
	receiveEntityRecords( 'postType', postType, [
		{ id: postId, template: 'custom' },
	] );
}

function renderUseTemplateId( registry, postType, postId ) {
	const { result } = renderHook(
		() => useTemplateId( { postType, postId } ),
		{
			wrapper: ( { children } ) => (
				<RegistryProvider value={ registry }>
					{ children }
				</RegistryProvider>
			),
		}
	);
	return result.current;
}

describe( 'useTemplateId', () => {
	it( 'resolves the assigned template for a post', () => {
		const registry = createRegistryWithTemplates();
		seedEntityWithAssignedTemplate( registry, 'post', 1 );

		expect( renderUseTemplateId( registry, 'post', '1' ) ).toBe(
			'theme//custom'
		);
	} );

	it( 'returns the template itself when editing a template', () => {
		const registry = createRegistryWithTemplates();

		expect(
			renderUseTemplateId( registry, 'wp_template', 'theme//single' )
		).toBe( 'theme//single' );
	} );

	it( 'returns undefined when there is no entity to resolve for', () => {
		const registry = createRegistryWithTemplates();

		expect(
			renderUseTemplateId( registry, undefined, undefined )
		).toBeUndefined();
	} );

	it.each( [
		[ 'wp_template_part', 'theme//header' ],
		[ 'wp_block', 7 ],
		[ 'wp_navigation', 8 ],
	] )(
		'returns undefined for %s, which is never queried content',
		( postType, postId ) => {
			const registry = createRegistryWithTemplates();
			seedEntityWithAssignedTemplate( registry, postType, postId );

			expect(
				renderUseTemplateId( registry, postType, String( postId ) )
			).toBeUndefined();
		}
	);

	it( 'still resolves for an attachment, which has its own place in the template hierarchy', () => {
		const registry = createRegistryWithTemplates();
		seedEntityWithAssignedTemplate( registry, 'attachment', 9 );

		expect( renderUseTemplateId( registry, 'attachment', '9' ) ).toBe(
			'theme//custom'
		);
	} );
} );
