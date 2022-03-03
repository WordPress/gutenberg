/**
 * External dependencies
 */
import createSelector from 'rememo';
import { set, get } from 'lodash';

/**
 * Internal dependencies
 */
import { getNormalizedCommaSeparable } from './utils';
import type {
	Context,
	EntityQuery,
	KeyOf,
	Kind,
	KindOf,
	Name,
	NameOf,
	RecordOf,
	Comment,
	DefaultContextOf,
	Entity,
} from './types';

// Placeholder State type for now
export type State = {
	entities: {
		data: {
			[ K in Kind ]?: {
				[ N in Extract<
					Entity< any >,
					{ kind: K }
				>[ 'name' ] ]?: KNState< K, N >;
			};
		};
	};
};

interface KNState< K extends Kind, N extends Name > {
	queriedData: {
		items: {
			[ C in Context | 'default' ]?: {
				[ key: number | string ]: RecordOf< K, N, C >;
			};
		};
		itemIsComplete: {
			[ C in Context | 'default' ]?: {
				[ key: number | string ]: boolean; // KeyOf< RecordOf< K, N, C > > & ( string | number ),
			};
		};
	};
}

const zxc: State = {} as any;
const cmt = zxc.entities.data.root!.comment!.queriedData.items.view?.[ 12 ];
const cmt2 = zxc.entities.data.root!.comment!.queriedData.items.default?.[ 12 ];
const cmt3 = zxc.entities.data.root!.comment!.queriedData.itemIsComplete
	.default?.[ 12 ];

/**
 * Returns the Entity's record object by key. Returns `null` if the value is not
 * yet received, undefined if the value entity is known to not exist, or the
 * entity object if it exists and is received.
 *
 * @param  state State tree
 * @param  kind  Entity kind.
 * @param  name  Entity name.
 * @param  key   Record's key
 * @param  query Optional query.
 *
 * @return Record.
 */
export const getEntityRecord = createSelector(
	function <
		R extends RecordOf< K, N >,
		C extends Context = DefaultContextOf< R >,
		K extends Kind = KindOf< R >,
		N extends Name = NameOf< R >,
		Q extends EntityQuery< any > = EntityQuery< C >
	>(
		state: State,
		kind: K,
		name: N,
		key: KeyOf< R > & ( string | number ),
		query?: Q
	): // | RecordOf< KindOf< R >, NameOf< R >, C >
	| // ( Q[ '_fields' ] extends string[]
		// 		?
		Partial< RecordOf< KindOf< R >, NameOf< R >, C > >
		// : RecordOf< KindOf< R >, NameOf< R >, C > )
		| null
		| undefined {
		const queriedState = state.entities.data[ kind ]?.[ name ]?.queriedData;
		if ( ! queriedState ) {
			return undefined;
		}
		const context = ( query?.context as Context ) ?? 'default';

		if ( query === undefined ) {
			// If expecting a complete item, validate that completeness.
			if ( ! queriedState.itemIsComplete[ context ]?.[ key ] ) {
				return undefined;
			}

			return queriedState.items[ context ]?.[ key ];
		}

		const item = queriedState.items[ context ]?.[ key ];
		if ( item && query._fields ) {
			const filteredItem: Partial<
				RecordOf< KindOf< R >, NameOf< R >, C >
			> = {};
			const fields = getNormalizedCommaSeparable( query._fields );
			if ( fields !== null ) {
				for ( let f = 0; f < fields.length; f++ ) {
					const field = fields[ f ].split( '.' );
					const value = get( item, field );
					set( filteredItem, field, value );
				}
			}
			// @TODO: Get rid of any when a larger portion of this package uses types.
			return filteredItem;
		}

		return item;
	},
	(
		state: State,
		kind: Kind,
		name: Name,
		recordId: string | number,
		query?: EntityQuery< Context >
	) => {
		const context = query?.context ?? 'default';
		return [
			get( state.entities.data, [
				kind,
				name,
				'queriedData',
				'items',
				context,
				recordId,
			] ),
			get( state.entities.data, [
				kind,
				name,
				'queriedData',
				'itemIsComplete',
				context,
				recordId,
			] ),
		] as any;
	}
);

// const commentDefault = getEntityRecord( {}, 'root', 'comment', 15 );
// // commentDefault is Comment<'edit'>

// const commentPartial = getEntityRecord( {}, 'root', 'comment', 15, {
// 	_fields: [ 'id' ],
// } );
// // commentPartial is Partial< Comment<'edit'> >
//
// const commentView = getEntityRecord( {}, 'root', 'comment', 15, {
// 	context: 'view',
// } );
// // commentView is Comment<'view'>
//
// const commentInvalidPK = getEntityRecord( {}, 'root', 'comment', '15' );
// // commentInvalidPK shows a TypeScript error
//
// const commentCustom = getEntityRecord<Comment< 'view' >, 'view'>({},	'root',	'comment',15,	{ context: 'view' });
// // commentCustom is Comment<'view'>
