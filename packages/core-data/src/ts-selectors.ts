/**
 * External dependencies
 */
import createSelector from 'rememo';
import { set, get } from 'lodash';

/**
 * Internal dependencies
 */
import type {
	EntityRecordType,
	NameOf,
	KindOf,
	Kind,
	Name,
	DefaultContextOf,
	EntityQuery,
	PrimaryKey,
} from './entities';
import { getNormalizedCommaSeparable } from './utils';
import type { Context } from './types';

// Placeholder State type for now
type State = any;

/**
 * Returns the Entity's record object by key. Returns `null` if the value is not
 * yet received, undefined if the value entity is known to not exist, or the
 * entity object if it exists and is received.
 *
 * @param {Object}  state State tree
 * @param {string}  kind  Entity kind.
 * @param {string}  name  Entity name.
 * @param {number}  key   Record's key
 * @param {?Object} query Optional query.
 *
 * @return {Object?} Record.
 */
export const getEntityRecord = createSelector(
	function <
		R extends EntityRecordType< K, N, C >,
		K extends Kind = KindOf< R >,
		N extends Name = NameOf< R >,
		C extends Context = DefaultContextOf< K, N >
	>(
		state: State,
		kind: K,
		name: N,
		key: PrimaryKey< R >,
		query?: EntityQuery< C >
	): R | null | undefined {
		const queriedState = get( state.entities.data, [
			kind,
			name,
			'queriedData',
		] );
		if ( ! queriedState ) {
			return undefined;
		}
		const context = query?.context ?? 'default';

		if ( query === undefined ) {
			// If expecting a complete item, validate that completeness.
			if ( ! queriedState.itemIsComplete[ context ]?.[ key ] ) {
				return undefined;
			}

			return queriedState.items[ context ][ key ];
		}

		const item = queriedState.items[ context ]?.[ key ];
		if ( item && query._fields ) {
			const filteredItem = {};
			const fields = getNormalizedCommaSeparable( query._fields );
			if ( fields !== null ) {
				for ( let f = 0; f < fields.length; f++ ) {
					const field = fields[ f ].split( '.' );
					const value = get( item, field );
					set( filteredItem, field, value );
				}
			}
			return filteredItem as R;
		}

		return item;
	},
	(
		state: State,
		kind: Kind,
		name: Name,
		recordId: PrimaryKey,
		query?: EntityQuery< any >
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
		];
	}
);

/*
const commentDefault = getEntityRecord( {}, 'root', 'comment', 15 );
// commentDefault is Comment<'edit'>

const commentView = getEntityRecord( {}, 'root', 'comment', 15, {
	context: 'view',
} );
// commentView is Comment<'view'>

const commentInvalidPK = getEntityRecord( {}, 'root', 'comment', '15' );
// commentInvalidPK shows a TypeScript error

const commentCustom = getEntityRecord<
	Comment< 'view' >,
	'root',
	'comment',
	'view'
>( {}, 'root', 'comment', 15, {
	context: 'view',
} );
// commentCustom is Comment<'view'>
*/
