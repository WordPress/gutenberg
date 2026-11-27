import { __, sprintf } from '@wordpress/i18n';
import type { BlockVisibilityViewport } from './constants';

export type ViewportRange = {
	id: string;
	min: number | null;
	max: number | null;
};

export type ViewportSettings = Partial<
	Record< 'mobile' | 'tablet', string >
> & {
	ranges?: { id: string; label: string; maxWidth: string | null }[];
};

export type BlockVisibility =
	| boolean
	| {
			viewport?: Partial< Record< BlockVisibilityViewport, boolean > >;
			viewportRanges?: { version: 1; hidden: ViewportRange[] };
	  };

const rangeId = /^[a-z][a-z0-9-]*$/;

export function getConfiguredViewportRanges( settings?: ViewportSettings ) {
	const ranges = settings?.ranges;
	if ( ! Array.isArray( ranges ) ) {
		return [];
	}
	const resolved: ( ViewportRange & { label: string } )[] = [];
	const ids = new Set< string >();
	let min: number | null = null;
	for ( const [ index, entry ] of ranges.entries() ) {
		if (
			! entry ||
			typeof entry.id !== 'string' ||
			! rangeId.test( entry.id ) ||
			ids.has( entry.id ) ||
			typeof entry.label !== 'string' ||
			! entry.label.trim()
		) {
			return [];
		}
		let max = null;
		if ( index === ranges.length - 1 ) {
			if ( entry.maxWidth !== null ) {
				return [];
			}
		} else {
			if (
				typeof entry.maxWidth !== 'string' ||
				! /^\d+(?:\.\d+)?px$/.test( entry.maxWidth )
			) {
				return [];
			}
			max = Number( entry.maxWidth.slice( 0, -2 ) );
			if ( ! Number.isFinite( max ) || max <= ( min ?? 0 ) ) {
				return [];
			}
		}
		resolved.push( { id: entry.id, label: entry.label.trim(), min, max } );
		ids.add( entry.id );
		min = max;
	}
	return resolved;
}

export function getSavedViewportRanges(
	visibility?: BlockVisibility | null
): ViewportRange[] {
	if ( ! visibility || typeof visibility !== 'object' ) {
		return [];
	}
	const saved = visibility.viewportRanges;
	if ( saved?.version !== 1 || ! Array.isArray( saved.hidden ) ) {
		return [];
	}
	const isBound = ( value: unknown ) =>
		value === null ||
		( typeof value === 'number' && Number.isFinite( value ) && value > 0 );
	return saved.hidden.filter(
		( range ) =>
			range &&
			typeof range.id === 'string' &&
			rangeId.test( range.id ) &&
			isBound( range.min ) &&
			isBound( range.max ) &&
			( range.min === null ||
				range.max === null ||
				range.min < range.max )
	);
}

export function viewportRangeKey( { min, max }: ViewportRange ) {
	return `range:${ min }:${ max }`;
}

export function formatViewportBounds( min: string | null, max: string | null ) {
	if ( min === null ) {
		if ( max === null ) {
			return __( 'All viewport widths' );
		}
		// translators: %s: Maximum viewport width, including its unit.
		return sprintf( __( 'Up to %s' ), max );
	}
	if ( max === null ) {
		// translators: %s: Minimum viewport width, including its unit.
		return sprintf( __( 'Above %s' ), min );
	}
	// translators: %1$s: Exclusive minimum viewport width. %2$s: Inclusive maximum viewport width.
	return sprintf( __( 'Above %1$s, up to %2$s' ), min, max );
}

export function formatSavedViewportRange( { min, max }: ViewportRange ) {
	return formatViewportBounds(
		min === null ? null : `${ min }px`,
		max === null ? null : `${ max }px`
	);
}

export function getViewportRangeMediaQuery( { min, max }: ViewportRange ) {
	if ( min === null && max === null ) {
		return '(width >= 0px)';
	}
	if ( min === null ) {
		return `(width <= ${ max }px)`;
	}
	if ( max === null ) {
		return `(width > ${ min }px)`;
	}
	return `(${ min }px < width <= ${ max }px)`;
}
