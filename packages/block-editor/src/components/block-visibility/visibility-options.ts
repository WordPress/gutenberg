import type { ReactElement } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { desktop } from '@wordpress/icons';
import { privateApis as globalStylesEnginePrivateApis } from '@wordpress/global-styles-engine';
import type { BlockVisibilityViewport } from './constants';
import {
	formatSavedViewportRange,
	formatViewportBounds,
	getConfiguredViewportRanges,
	getSavedViewportRanges,
	viewportRangeKey,
} from './ranges';
import type {
	BlockVisibility,
	ViewportRange,
	ViewportSettings,
} from './ranges';
import { getBlockVisibilityViewportEntries } from './utils';
import { unlock } from '../../lock-unlock';

const { getViewportBreakpoints } = unlock< {
	getViewportBreakpoints: ( settings?: ViewportSettings ) => ViewportSettings;
} >( globalStylesEnginePrivateApis );

type VisibilityOption = {
	key: string;
	label: string;
	icon: ReactElement;
	legacy?: BlockVisibilityViewport;
	legacyAlias?: BlockVisibilityViewport;
	range?: ViewportRange;
};

function getLegacyFlags( value: BlockVisibility | undefined ) {
	return value && typeof value === 'object' ? value.viewport : undefined;
}

export function getVisibilityOptions(
	settings: ViewportSettings | undefined,
	values: ( BlockVisibility | undefined )[]
): VisibilityOption[] {
	const legacy = getBlockVisibilityViewportEntries( settings ).map(
		( [ , { key, label, icon } ] ) => ( { key, label, icon, legacy: key } )
	);
	const configured = getConfiguredViewportRanges( settings );
	const options: VisibilityOption[] = configured.map(
		( { label, ...range } ) => ( {
			key: viewportRangeKey( range ),
			label,
			icon: desktop,
			range,
		} )
	);
	if ( options.length === 0 ) {
		options.push( ...legacy );
	} else {
		const { mobile = null, tablet = null } =
			getViewportBreakpoints( settings );
		const bounds = {
			mobile: [ null, mobile ],
			tablet: [ mobile, tablet ],
			desktop: [ tablet ?? mobile, null ],
		} as const;
		// Keep legacy CSS units intact. Only pixel ranges can be projected exactly.
		const toPixels = ( bound: string | null ) => {
			if ( bound === null ) {
				return null;
			}
			return /^\d+(?:\.\d+)?px$/.test( bound )
				? parseFloat( bound )
				: NaN;
		};
		for ( const option of legacy ) {
			const [ min, max ] = bounds[ option.legacy ];
			const first = configured.findIndex(
				( range ) => range.min === toPixels( min )
			);
			const last = configured.findIndex(
				( range ) => range.max === toPixels( max )
			);
			if ( first !== -1 && last >= first ) {
				for ( const alias of options.slice( first, last + 1 ) ) {
					alias.legacyAlias = option.legacy;
				}
			} else if (
				values.some(
					( value ) =>
						getLegacyFlags( value )?.[ option.legacy ] === false
				)
			) {
				options.push( {
					...option,
					label: sprintf(
						// translators: %1$s: Saved viewport name. %2$s: Effective width range.
						__( '%1$s (previous setting, %2$s)' ),
						option.label,
						formatViewportBounds( min, max )
					),
				} );
			}
		}
	}

	const keys = new Set( options.map( ( { key } ) => key ) );
	for ( const range of values.flatMap( getSavedViewportRanges ) ) {
		const key = viewportRangeKey( range );
		if ( ! keys.has( key ) ) {
			options.push( {
				key,
				range,
				icon: desktop,
				label: sprintf(
					// translators: %s: The width range of a previously saved visibility rule.
					__( 'Previously saved range (%s)' ),
					formatSavedViewportRange( range )
				),
			} );
			keys.add( key );
		}
	}
	return options;
}

export function getVisibilityOptionState(
	values: ( BlockVisibility | undefined )[],
	option: VisibilityOption
) {
	const hidden = values.filter( ( value ) => {
		const legacy = option.legacy ?? option.legacyAlias;
		return (
			( legacy && getLegacyFlags( value )?.[ legacy ] === false ) ||
			( option.range &&
				getSavedViewportRanges( value ).some(
					( range ) => viewportRangeKey( range ) === option.key
				) )
		);
	} ).length;
	if ( hidden === 0 ) {
		return false;
	}
	return hidden === values.length ? true : null;
}

export function applyVisibilityChanges(
	value: BlockVisibility | undefined,
	options: VisibilityOption[],
	changes: Record< string, boolean >
): BlockVisibility {
	const viewport = { ...getLegacyFlags( value ) };
	const hidden = new Map(
		getSavedViewportRanges( value ).map( ( range ) => [
			viewportRangeKey( range ),
			range,
		] )
	);
	for ( const option of options ) {
		const checked = changes[ option.key ];
		if ( checked === undefined ) {
			continue;
		}
		if ( option.legacy ) {
			if ( checked ) {
				viewport[ option.legacy ] = false;
			} else {
				delete viewport[ option.legacy ];
			}
		} else if ( option.range ) {
			const alias = option.legacyAlias;
			if ( ! checked && alias && viewport[ alias ] === false ) {
				// Expand only the legacy rule the author chose to change.
				for ( const sibling of options ) {
					if ( sibling.legacyAlias === alias && sibling.range ) {
						hidden.set( sibling.key, sibling.range );
					}
				}
				delete viewport[ alias ];
			}
			if ( checked ) {
				hidden.set( option.key, option.range );
			} else {
				hidden.delete( option.key );
			}
		}
	}
	const result = { ...( typeof value === 'object' ? value : {} ), viewport };
	if ( hidden.size ) {
		result.viewportRanges = { version: 1, hidden: [ ...hidden.values() ] };
	} else if ( result.viewportRanges?.version === 1 ) {
		delete result.viewportRanges;
	}
	return result;
}
