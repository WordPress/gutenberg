/**
 * External dependencies
 */
import { rest } from 'msw';

/**
 * Internal dependencies
 */
import sidebars from './sidebars';
import widgets from './widgets';

export const handlers = [
	rest.options( '/wp/v2/media?_locale=user', ( req, res, ctx ) => {
		return res( ctx.status( 200 ), ctx.json( {} ) );
	} ),
	rest.get(
		'/wp/v2/sidebars?per_page=100&context=edit&_locale=user',
		( req, res, ctx ) => {
			return res( ctx.status( 200 ), ctx.json( sidebars ) );
		}
	),
	rest.get(
		'/wp/v2/widgets?per_page=100&context=edit&_locale=user',
		( req, res, ctx ) => {
			return res( ctx.status( 200 ), ctx.json( widgets ) );
		}
	),
	rest.get( '/wp/v2/types?context=edit&_locale=user', ( req, res, ctx ) => {
		return res( ctx.status( 200 ), ctx.json( {} ) );
	} ),
	rest.options( '/wp/v2/blocks?_locale=user', ( req, res, ctx ) => {
		return res( ctx.status( 200 ), ctx.json( {} ) );
	} ),
	rest.get( '/wp/v2/blocks?_locale=user', ( req, res, ctx ) => {
		return res( ctx.status( 200 ), ctx.json( [] ) );
	} ),
];
