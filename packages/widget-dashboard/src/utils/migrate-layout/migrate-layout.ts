/**
 * Internal dependencies
 */
import type {
	DashboardWidget,
	GridTilePlacement,
	MasonryTilePlacement,
	WidgetGridModel,
} from '../../types';

interface MigrationContext {
	/**
	 * Column count of the currently-mounted grid surface. Used to
	 * resolve `'full'` widths to a concrete numeric span when going
	 * from the 2D grid model to masonry. When the surface is in
	 * responsive mode and the runtime column count is unknown,
	 * callers should pass a sensible fallback (e.g., the default of
	 * 6 used by `@wordpress/grid`).
	 */
	columns: number;
}

const FALLBACK_COLUMNS = 6;

/**
 * Coerces a `'fill'`/`'full'`/numeric width into a concrete numeric
 * span when migrating from `'grid'` to `'masonry'`. `'fill'` collapses
 * to a single column; resolving it against per-row remainder would
 * require either DOM measurement or replicating CSS-Grid's auto-flow
 * placement, both of which were judged not worth the complexity for
 * a one-shot migration the user can correct visually in staging.
 *
 * @param width         Source width from a grid placement.
 * @param targetColumns Column count to use for `'full'` widths.
 */
function gridWidthToMasonryWidth(
	width: GridTilePlacement[ 'width' ],
	targetColumns: number
): number {
	if ( width === 'full' ) {
		return targetColumns;
	}
	if ( width === 'fill' || width === undefined ) {
		return 1;
	}
	return width;
}

/**
 * Transforms a single placement from the 2D grid shape to the masonry
 * shape. Drops `height` (masonry derives heights from content),
 * preserves `order`, leaves `lane` unset so the auto-flow placer
 * arranges items by source order.
 *
 * @param placement Source grid placement.
 * @param context   Migration context (column count).
 */
function migratePlacementGridToMasonry(
	placement: GridTilePlacement | undefined,
	context: MigrationContext
): MasonryTilePlacement {
	if ( ! placement ) {
		return {};
	}

	const next: MasonryTilePlacement = {};
	const width = gridWidthToMasonryWidth( placement.width, context.columns );
	if ( width !== 1 ) {
		next.width = width;
	}
	if ( placement.order !== undefined ) {
		next.order = placement.order;
	}
	return next;
}

/**
 * Transforms a single placement from the masonry shape to the 2D grid
 * shape. Preserves the numeric width, drops `lane` (the 2D grid
 * auto-packs and has no pin-to-column concept), and seeds `height: 1`
 * since masonry never persisted a height. The user is expected to
 * resize tiles vertically after the migration.
 *
 * @param placement Source masonry placement.
 */
function migratePlacementMasonryToGrid(
	placement: MasonryTilePlacement | undefined
): GridTilePlacement {
	if ( ! placement ) {
		return { height: 1 };
	}

	const next: GridTilePlacement = { height: 1 };
	if ( placement.width !== undefined ) {
		next.width = placement.width;
	}
	if ( placement.order !== undefined ) {
		next.order = placement.order;
	}
	return next;
}

/**
 * Migrates every widget's `placement` between grid models.
 *
 * The two storage shapes overlap on `width` and `order` but diverge
 * on the rest: 2D grid carries `height` and discriminated string
 * widths (`'fill'`/`'full'`), lanes carries `lane` and only numeric
 * widths. Each conversion loses information that the target model
 * cannot represent. The caller is responsible for surfacing the
 * result to the user in a way that lets them correct visually.
 *
 * When `from === to`, the input is returned unchanged.
 *
 * @param widgets Widgets to migrate.
 * @param from    Source model. `undefined` is treated as `'grid'`.
 * @param to      Target model.
 * @param context Information that depends on the live render (today
 *                only `columns`).
 */
export function migrateLayout(
	widgets: DashboardWidget[],
	from: WidgetGridModel | undefined,
	to: WidgetGridModel,
	context: Partial< MigrationContext > = {}
): DashboardWidget[] {
	const resolvedFrom: WidgetGridModel = from ?? 'grid';
	if ( resolvedFrom === to ) {
		return widgets;
	}

	const resolvedContext: MigrationContext = {
		columns: context.columns ?? FALLBACK_COLUMNS,
	};

	if ( resolvedFrom === 'grid' && to === 'masonry' ) {
		return widgets.map( ( widget ) => ( {
			...widget,
			placement: migratePlacementGridToMasonry(
				widget.placement as GridTilePlacement | undefined,
				resolvedContext
			),
		} ) );
	}

	if ( resolvedFrom === 'masonry' && to === 'grid' ) {
		return widgets.map( ( widget ) => ( {
			...widget,
			placement: migratePlacementMasonryToGrid(
				widget.placement as MasonryTilePlacement | undefined
			),
		} ) );
	}

	return widgets;
}
