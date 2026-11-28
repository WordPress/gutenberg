import fastDeepEqual from 'fast-deep-equal/es6/index.js';
import type { WidgetType } from '@wordpress/widget-primitives';
import { canonicalizeLayout } from './canonicalize-layout';
import type { WidthOptionsResolution } from './resolve-width-options';
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
 * Width governance from the host's width choices owns the width alone,
 * keeping a staged height edit when the width must come back.
 */
const SIZE_FIELDS = [ 'width', 'height' ] as const;
const WIDTH_FIELDS = [ 'width' ] as const;
const POSITION_FIELDS = [ 'lane' ] as const;

/**
 * The width resolutions the staging boundary acts on: the host's choices
 * or their failed validation. The `default` resolution never reaches
 * the enforcement, so the boundary is defined over these two kinds.
 */
type EnforceableWidthOptions = Extract<
	WidthOptionsResolution,
	{ kind: 'custom' | 'invalid' }
>;

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

	/**
	 * The host's validated width choices; `undefined` (the `default`
	 * resolution) applies none. Present, the widths of changed or newly
	 * inserted placements must stay within the choices: a staged width
	 * outside them is restored to the prior (committed) width while
	 * independent edits survive, a new insertion with no width to
	 * restore is rejected, and a failed validation — the `invalid`
	 * resolution — denies every width change.
	 */
	widthOptions?: EnforceableWidthOptions;
}

/**
 * Whether a width token is storable under the resolved width choices:
 * an `invalid` configuration allows nothing, and the choices must
 * include the token (an absent width is not a choice). The token comes
 * through placement access as `unknown` and compares by value.
 *
 * @param width   The placement width token, or undefined when unset.
 * @param options The validated width choices.
 */
function isWidthAllowed(
	width: unknown,
	options: EnforceableWidthOptions
): boolean {
	if ( options.kind === 'invalid' ) {
		return false;
	}
	return options.options.some( ( option ) => option.value === width );
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
 * The host's `widthOptions`, when supplied, govern widths on top of the
 * policy's own `resize` answer: a changed width must be one of the
 * choices, or the width alone is re-asserted from `previous` (a staged
 * height edit survives as an independent allowed change), and a new
 * instance must arrive with an allowed width or be rejected, since
 * there is no committed width to restore. A failed validation — the
 * `invalid` resolution — denies every width change and rejects every
 * insertion, failing closed rather than restoring unrestricted choices.
 * Existing unsupported widths pass unchanged, staying visible without
 * being introduced anew.
 *
 * Both layouts are canonicalized before the diff (sorted by
 * `order ?? index` with `order` stripped, as the renderer and the
 * commit read them), so a move is a move whichever encoding expressed
 * it. Returns `next` itself when it was already canonical and nothing
 * was re-asserted.
 *
 * @param {EnforceLayoutPolicyArgs} args The layouts to diff, the policy, and the width choices.
 * @return {DashboardWidget[]} The incoming layout with denied changes re-asserted.
 */
export function enforceLayoutPolicy( {
	previous: rawPrevious,
	next: rawNext,
	canPerform,
	widgetTypes,
	widthOptions,
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
			if (
				widthOptions &&
				! isWidthAllowed( placementOf( incoming ).width, widthOptions )
			) {
				// Reject the insertion: a new instance has no committed
				// width to restore, so it must arrive with an allowed
				// width.
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

		// Width governance, independent of the policy's resize answer:
		// any changed width must be one of the host's choices, or the
		// width alone is re-asserted from `previous` — keeping the staged
		// height, attributes, and position as independent allowed edits.
		// An unchanged width needs no validation, so a legacy stored
		// width outside the choices stays visible without a new change.
		if ( widthOptions ) {
			const priorWidth = placementOf( prior ).width;
			const stagedWidth = placementOf( staged ).width;
			if (
				priorWidth !== stagedWidth &&
				! isWidthAllowed( stagedWidth, widthOptions )
			) {
				staged = restorePlacementFields( staged, prior, WIDTH_FIELDS );
			}
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
