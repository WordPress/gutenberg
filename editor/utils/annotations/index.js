/**
 * External dependencies
 */
import memoize from 'memize';
import { moment } from 'moment';
import {
	omit,
	reduce,
	filter,
	orderBy,
	castArray,
} from 'lodash';

/**
 * WordPress Dependencies
 */
import { objectMatches } from '@wordpress/utils';

/**
 * Returns annotations + all children deeply.
 *
 * @param  {Object[]}       annotations Array of annotations to query.
 * @param  {?(Object|null)} filters     Any required {key: value} filters.
 *                                      See {@link objectMatches()} for details.
 * @param  {?Boolean}       deep        Include all children deeply? Default is true.
 *
 * @return {Object[]}                   An array of annotation objects (memoized query).
 */
export const queryAnnotations = memoize(
	( annotations, filters = null, deep = true ) => {
		if ( filters ) { // Remove filters unsupported here.
			filters = omit( filters, [ 'blockUid' /* handled by getAnnotations() */ ] );
		}
		const objects = filter( annotations, object => objectMatches( object, filters ) );
		return deep ? objects.concat( queryChildAnnotations( annotations, objects, filters, deep ) ) : objects;
	},
	{ maxSize: 10 }
);

/**
 * Returns child annotations + all granchildren deeply.
 *
 * @param  {Object[]}                          annotations Array of annotations to query.
 * @param  {(Object|Object[]|Number|Number[])} parents     Parent annotation object(s) or ID(s).
 * @param  {?(Object|null)}                    filters     Any required {key: value} filters.
 *                                                         See {@link objectMatches()} for details.
 * @param  {?Boolean}                          deep        Include all granchildren deeply? Default is true.
 *
 * @return {Object[]}                                      An array of annotation objects.
 */
export function queryChildAnnotations( annotations, parents, filters = null, deep = true ) {
	parents = castArray( parents );
	parents = parents.map( parent => parent.id || parent );

	if ( filters ) { // Remove filters unsupported here.
		filters = omit( filters, [ 'id', 'parent', 'blockUid' ] );
	}

	let objects = filter( annotations, ( object ) => {
		return parents.includes( object.parent ) && // A child?
			! parents.includes( object.id ) && objectMatches( object, filters );
	} );

	if ( deep ) { // Granchildren too?
		objects = reduce( objects, ( accuChildren, { id: childId } ) => {
			return accuChildren.concat( filter( annotations, ( object ) => {
				return childId === object.parent && // A grandchild?
					! parents.concat( accuChildren ).includes( object.id ) && objectMatches( object, filters );
			} ) );
		}, objects );
	}

	return objects;
}

/**
 * Extracts top-level annotations.
 *
 * @param  {Object[]} annotations Array of annotations to extract from.
 *
 * @return {Object[]}             An array of top-level annotation objects.
 *                                Note that top-level doesn't necessarily mean parent=0.
 *                                A top-level annotation is one whose parent is not in a filtered subset.
 */
export function extractTopLevelAnnotations( annotations ) {
	const ids = annotations.map( ( { id } ) => id );

	return reduce( annotations, ( accuParents, object ) => {
		if ( ! ids.includes( object.parent ) ) {
			accuParents.push( object );
		}
		return accuParents;
	}, [] );
}

/**
 * Orders an array of annotations by date.
 *
 * @param  {Object[]} annotations   Array of annotations to order.
 * @param  {string}   [order='asc'] Either 'asc' or 'desc' sort order.
 *
 * @return {Object[]}               An array of ordered annotation objects.
 */
export function orderAnnotationsByDate( annotations, order = 'asc' ) {
	return orderBy( annotations, ( object ) => {
		return moment.utc( object.date_gmt, moment.ISO_8601 ).unix();
	}, [ order ] );
}
