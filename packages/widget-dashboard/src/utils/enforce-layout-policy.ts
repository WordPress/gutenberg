import fastDeepEqual from 'fast-deep-equal/es6/index.js';
import type { WidgetType } from '@wordpress/widget-primitives';
import { canonicalizeLayout } from './canonicalize-layout';
import type {
	CanPerformDashboardOperation,
	DashboardInstanceOperation,
	DashboardTilePlacement,
	DashboardWidget,
} from '../types';

/*
 * Placement fields by facet. `resize` owns the spans; `move` owns the
 * masonry lane pin. Explicit `order` never reaches the diff: both
 * layouts are canonicalized first, so position IS the array position.
 */
const SIZE_FIELDS = [ 'width', 'height' ] as const;
const POSITION_FIELDS = [ 'lane' ] as const;

type PlacementFields = readonly string[];

function placementOf( widget: DashboardWidget ): Record< string, unknown > {
	return ( widget.placement ?? {} ) as Record< string, unknown >;
}

function placementFieldsEqual(
	a: DashboardWidget,
	b: DashboardWidget,
	fields: PlacementFields
): boolean {
	const pa = placementOf( a );
	const pb = placementOf( b );
	return fields.every( ( field ) => pa[ field ] === pb[ field ] );
}

function restorePlacementFields(
	widget: DashboardWidget,
	prior: DashboardWidget,
	fields: PlacementFields
): DashboardWidget {
	const restored = { ...placementOf( widget ) };
	const priorPlacement = placementOf( prior );
	for ( const field of fields ) {
		if ( field in priorPlacement ) {
			restored[ field ] = priorPlacement[ field ];
		} else {
			delete restored[ field ];
		}
	}
	if ( ! Object.keys( restored ).length && ! prior.placement ) {
		const { placement: _dropped, ...rest } = widget;
		return rest;
	}
	return { ...widget, placement: restored as DashboardTilePlacement };
}

interface EnforceLayoutPolicyArgs {
	/**
	 * The staging layout the incoming one replaces.
	 */
	previous: DashboardWidget[];

	/**
	 * The incoming layout.
	 */
	next: DashboardWidget[];

	/**
	 * The resolved policy.
	 */
	canPerform: CanPerformDashboardOperation;

	/**
	 * Registered types, to resolve each instance's `WidgetType` for the
	 * policy request.
	 */
	widgetTypes: WidgetType[];
}

/**
 * Re-asserts every change the policy denies before a layout enters
 * staging, so no composed trigger can slip a denied operation past the
 * interface: what the UI hides, the staging layer rejects.
 *
 * Per instance: a new instance whose type the policy rejects for
 * `insert` is dropped. An unregistered type has no type to ask about,
 * so a new instance of one passes, and instance operations on a
 * surviving tile still ask with `widgetType` absent: a lock keyed on
 * the type does not fire. Denied `edit` keeps the staged `attributes`;
 * denied `resize` keeps the placement spans; denied `move` keeps the
 * masonry `lane` and holds the instance's canonical position, adjusted
 * for allowed membership changes: the same hold `remove` uses, and the
 * position the grid's pinned items keep.
 *
 * Both layouts are canonicalized before the diff (sorted by
 * `order ?? index` with `order` stripped, as the renderer and the
 * commit read them), so a move is a move whichever encoding expressed
 * it. Returns `next` itself when it was already canonical and nothing
 * was re-asserted.
 *
 * @param {EnforceLayoutPolicyArgs} args The layouts to diff and the policy.
 * @return {DashboardWidget[]} The incoming layout with denied changes re-asserted.
 */
export function enforceLayoutPolicy( {
	previous: rawPrevious,
	next: rawNext,
	canPerform,
	widgetTypes,
}: EnforceLayoutPolicyArgs ): DashboardWidget[] {
	const previous = canonicalizeLayout( rawPrevious );
	const next = canonicalizeLayout( rawNext );

	const typeOf = ( widget: DashboardWidget ) =>
		widgetTypes.find( ( type ) => type.name === widget.type );
	const priorByUuid = new Map(
		previous.map( ( widget ) => [ widget.uuid, widget ] )
	);

	// Instances free to take the position `next` gives them, in `next`
	// order; move-denied survivors are staged aside to be held instead.
	const free: DashboardWidget[] = [];
	const heldByUuid = new Map< string, DashboardWidget >();

	for ( const incoming of next ) {
		const prior = priorByUuid.get( incoming.uuid );

		if ( ! prior ) {
			const widgetType = typeOf( incoming );
			if (
				widgetType &&
				! canPerform( { operation: 'insert', widgetType } )
			) {
				continue;
			}
			free.push( incoming );
			continue;
		}

		const widgetType = typeOf( prior );
		const allows = ( operation: DashboardInstanceOperation ) =>
			canPerform( { operation, widget: prior, widgetType } );

		let staged = incoming;
		if (
			! fastDeepEqual( prior.attributes, incoming.attributes ) &&
			! allows( 'edit' )
		) {
			staged = { ...staged };
			if ( 'attributes' in prior ) {
				staged.attributes = prior.attributes;
			} else {
				delete staged.attributes;
			}
		}
		if (
			! placementFieldsEqual( prior, staged, SIZE_FIELDS ) &&
			! allows( 'resize' )
		) {
			staged = restorePlacementFields( staged, prior, SIZE_FIELDS );
		}

		if ( allows( 'move' ) ) {
			free.push( staged );
			continue;
		}
		if ( ! placementFieldsEqual( prior, staged, POSITION_FIELDS ) ) {
			staged = restorePlacementFields( staged, prior, POSITION_FIELDS );
		}
		heldByUuid.set( staged.uuid, staged );
	}

	// Walk `previous` to place what holds a position: move-denied
	// survivors and denied removals land at their previous index,
	// discounting the instances that legitimately left.
	const nextUuids = new Set( next.map( ( widget ) => widget.uuid ) );
	const result = [ ...free ];
	let absent = 0;
	const place = ( widget: DashboardWidget, index: number ) =>
		result.splice( Math.min( index - absent, result.length ), 0, widget );

	previous.forEach( ( widget, index ) => {
		if ( ! nextUuids.has( widget.uuid ) ) {
			const removable = canPerform( {
				operation: 'remove',
				widget,
				widgetType: typeOf( widget ),
			} );
			if ( removable ) {
				absent += 1;
				return;
			}
			place( widget, index );
			return;
		}

		const held = heldByUuid.get( widget.uuid );
		if ( held ) {
			place( held, index );
		}
	} );

	const untouched =
		result.length === next.length &&
		result.every( ( widget, index ) => widget === next[ index ] );
	return untouched ? next : result;
}
