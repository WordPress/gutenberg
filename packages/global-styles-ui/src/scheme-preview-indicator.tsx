/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Icon, moon, sun } from '@wordpress/icons';
import type { BasePreset } from '@wordpress/global-styles-engine';

/**
 * Internal dependencies
 */
import { useSetting } from './hooks';
import {
	flattenSchemePresets,
	type SchemePresetCollection,
} from './color-scheme-palette';

type SchemeSettings = Partial<
	Record<
		'palette' | 'gradients' | 'duotone',
		SchemePresetCollection< BasePreset >
	>
>;

export function hasSchemePresets( scheme?: SchemeSettings ): boolean {
	const presetTypes: ( keyof SchemeSettings )[] = [
		'palette',
		'gradients',
		'duotone',
	];
	return presetTypes.some(
		( presetType ) =>
			flattenSchemePresets( scheme?.[ presetType ] ).length > 0
	);
}

export default function SchemePreviewIndicator( { ratio }: { ratio: number } ) {
	const [ lightScheme ] = useSetting< SchemeSettings >(
		'color.light',
		undefined,
		'base'
	);
	const [ darkScheme ] = useSetting< SchemeSettings >(
		'color.dark',
		undefined,
		'base'
	);

	const schemes = [
		...( hasSchemePresets( lightScheme )
			? [
					{
						icon: sun,
						label: __( 'Light color scheme available' ),
					},
			  ]
			: [] ),
		...( hasSchemePresets( darkScheme )
			? [
					{
						icon: moon,
						label: __( 'Dark color scheme available' ),
					},
			  ]
			: [] ),
	];

	if ( schemes.length === 0 ) {
		return null;
	}

	const badgeSize = Math.max( 16, Math.min( 24, 20 * ratio ) );
	const inset = Math.max( 4, Math.min( 8, 6 * ratio ) );

	return (
		<div
			className="global-styles-ui-preview__scheme-indicators"
			style={ {
				bottom: inset,
				gap: Math.max( 2, 3 * ratio ),
				insetInlineEnd: inset,
			} }
		>
			{ schemes.map( ( scheme ) => (
				<span
					key={ scheme.label }
					aria-label={ scheme.label }
					className="global-styles-ui-preview__scheme-indicator"
					role="img"
					style={ {
						height: badgeSize,
						width: badgeSize,
					} }
				>
					<Icon icon={ scheme.icon } size={ badgeSize - 6 } />
				</span>
			) ) }
		</div>
	);
}
