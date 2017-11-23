import { sortBy, includes, last, difference, isEqual } from 'lodash';

function getRange( start, end, ordering ) {
	if ( start && ! end ) {
		return [ start ];
	} else if ( ! start && ! end ) {
		return [ ];
	}

	const startIndex = ordering.indexOf( start );
	const endIndex = ordering.indexOf( end );

	if ( startIndex > endIndex ) {
		return ordering.slice( endIndex, startIndex + 1 );
	}

	return ordering.slice( startIndex, endIndex + 1 );
}

function sortByOrder( ordering ) {
	return ( a ) => ordering.indexOf( a );
}

function getSelected( current, ordering ) {
	const ranged = getRange( current.start, current.end, ordering );
	return sortBy( current.selected.concat( ranged ), sortByOrder( ordering ) );
}

export function reset( current, uid ) {
	return {
		selected: [ ],
		start: uid,
		end: null,
	};
}

export function resetRange( current, start, end ) {
	return {
		selected: [ ],
		start: start,
		end: end,
	};
}

export function toggle( current, uid, ordering ) {
	console.log("TOGGLING");
	const everything = getSelected( current, ordering );

	if ( ! includes( everything, uid ) ) {
		// This is not in our selection, so let's make it our new anchor
		return { selected: everything, start: uid, end: uid };
	}

	const withoutUid = difference( everything, [ uid ] );

	if ( current.start === uid ) {
		console.log( "STARTING");
		const nextStart = last( withoutUid );
		if ( nextStart ) {
			console.log("NEXTING");
			return { selected: withoutUid.slice( 0, withoutUid.length - 1 ), start: nextStart, end: nextStart };
		}
		console.log("OTHERING");

		// I don't know what should happen here
		return { selected: [ ], start: uid, end: null };
	}

	return { selected: difference( withoutUid, [ current.start ] ), start: current.start, end: current.start };
}

export function includeRange( current, start, end, ordering ) {
	const inRange = getRange( start, end, ordering );
	const withoutRange = difference( current.selected, inRange );
	return { selected: withoutRange, start: start, end: end };
}

export function combineRange( current, start, end, ordering ) {
	const everything = getSelected( current, ordering );

	const inRange = getRange( start, end, ordering );

	const withoutRange = difference( everything, inRange );
	return { selected: withoutRange, start: start, end: end };
}

