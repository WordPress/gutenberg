import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import {
	getBlockTypes,
	serialize,
	unregisterBlockType,
} from '@wordpress/blocks';
import { registerCoreBlocks } from '@wordpress/block-library';
import { store as coreStore } from '@wordpress/core-data';
import { createRegistry } from '@wordpress/data';
import {
	getWidgetIdFromBlock,
	registerLegacyWidgetBlock,
} from '@wordpress/widgets';
import { store as widgetsStore } from '../index';
import {
	transformBlockToWidget,
	transformWidgetToBlock,
} from '../transformers';
import { buildWidgetAreaPostId, buildWidgetsQuery } from '../utils';

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

beforeAll( () => {
	registerCoreBlocks();
	registerLegacyWidgetBlock();
} );

afterAll( () => {
	getBlockTypes().forEach( ( { name } ) => unregisterBlockType( name ) );
} );

describe( 'transformWidgetToBlock', () => {
	it.each( [ {}, { content: null }, { content: '' }, { content: ' \n' } ] )(
		'preserves an empty widget as an editable paragraph: %j',
		( raw ) => {
			const widget = {
				id: 'block-empty',
				id_base: 'block',
				instance: { raw },
			};
			const block = transformWidgetToBlock( widget );

			expect( block.name ).toBe( 'core/paragraph' );
			expect( String( block.attributes.content ) ).toBe( '' );
			expect( getWidgetIdFromBlock( block ) ).toBe( widget.id );
			expect( transformBlockToWidget( block, widget ) ).toMatchObject( {
				id: widget.id,
				id_base: 'block',
				instance: { raw: { content: serialize( block ) } },
			} );
		}
	);

	it( 'retains nonempty block content, inline formatting, and widget identity', () => {
		const widget = {
			id: 'block-valid',
			id_base: 'block',
			instance: {
				raw: {
					content:
						'<!-- wp:paragraph --><p>Visible <strong>widget</strong></p><!-- /wp:paragraph -->',
				},
			},
		};
		const block = transformWidgetToBlock( widget );

		expect( block.name ).toBe( 'core/paragraph' );
		expect( String( block.attributes.content ) ).toBe(
			'Visible <strong>widget</strong>'
		);
		expect( getWidgetIdFromBlock( block ) ).toBe( widget.id );
	} );

	it.each( [ true, false ] )(
		'retains legacy widgets (is_multi=%s)',
		( isMulti ) => {
			const widget = {
				id: 'legacy-widget',
				id_base: 'legacy',
				instance: { raw: { title: 'Legacy widget' } },
				_embedded: { about: [ { is_multi: isMulti } ] },
			};
			const block = transformWidgetToBlock( widget );

			expect( block.name ).toBe( 'core/legacy-widget' );
			expect( getWidgetIdFromBlock( block ) ).toBe( widget.id );
			expect( transformBlockToWidget( block, widget ) ).toMatchObject(
				widget
			);
		}
	);
} );

describe( 'getWidgets resolution', () => {
	it.each( [ 'first', 'last' ] )(
		'loads active sidebars when an empty inactive widget is %s',
		async ( position ) => {
			const registry = createRegistry();
			registry.register( coreStore );
			registry.register( widgetsStore );
			const activeWidgets = [ 'one', 'two' ].map( ( sidebar ) => ( {
				id: `block-${ sidebar }`,
				id_base: 'block',
				sidebar: `sidebar-${ sidebar }`,
				instance: {
					raw: {
						content: `<!-- wp:paragraph --><p>Widget ${ sidebar }</p><!-- /wp:paragraph -->`,
					},
				},
			} ) );
			const emptyWidget = {
				id: 'block-empty',
				id_base: 'block',
				sidebar: 'wp_inactive_widgets',
				instance: { raw: {} },
			};
			const widgets =
				position === 'first'
					? [ emptyWidget, ...activeWidgets ]
					: [ ...activeWidgets, emptyWidget ];
			const query = buildWidgetsQuery();
			await registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'root', 'widget', widgets, query );
			registry
				.dispatch( coreStore )
				.finishResolution( 'getEntityRecords', [
					'root',
					'widget',
					query,
				] );

			await registry.resolveSelect( widgetsStore ).getWidgets();

			expect(
				registry
					.select( widgetsStore )
					.hasResolutionFailed( 'getWidgets', [] )
			).toBe( false );
			for ( const widget of widgets ) {
				const post = registry
					.select( coreStore )
					.getRawEntityRecord(
						'root',
						'postType',
						buildWidgetAreaPostId( widget.sidebar )
					);
				expect( post.blocks ).toHaveLength( 1 );
				expect( getWidgetIdFromBlock( post.blocks[ 0 ] ) ).toBe(
					widget.id
				);
				expect( String( post.blocks[ 0 ].attributes.content ) ).toBe(
					widget === emptyWidget
						? ''
						: `Widget ${ widget.sidebar.slice( 8 ) }`
				);
			}
		}
	);
} );
