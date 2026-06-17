/**
 * External dependencies
 */
import fastDeepEqual from 'fast-deep-equal/es6/index.js';

/**
 * WordPress dependencies
 */
import { useCallback, useMemo } from '@wordpress/element';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { setImmutably } from '../../utils/set-immutably';
import { useGlobalStyles } from './hooks';

const PALETTE_PATHS = {
	custom: [ 'settings', 'color', 'palette', 'custom' ],
	theme: [ 'settings', 'color', 'palette', 'theme' ],
	default: [ 'settings', 'color', 'palette', 'default' ],
};

// Stable id so successive palette mutations replace the previous snackbar
// instead of stacking up.
const COLOR_PALETTE_NOTICE_ID = 'editor/color-palette-editor';

export function getOptimisticPaletteValue(
	paletteSlug,
	nextPalette,
	basePalette
) {
	if ( paletteSlug === 'custom' ) {
		return nextPalette.length ? nextPalette : undefined;
	}
	if ( fastDeepEqual( nextPalette, basePalette ) ) {
		return undefined;
	}
	return nextPalette;
}

export function getRollbackPaletteValue( paletteSlug, previousPalette ) {
	if ( paletteSlug === 'custom' ) {
		return previousPalette?.length ? previousPalette : undefined;
	}
	return previousPalette;
}

/**
 * Whether palette editing affordances should be exposed to the color picker.
 * Extracted for unit testing; the REST controller is the real enforcement.
 *
 * @param {Object}  args                     Arguments.
 * @param {boolean} args.isReady             Global styles config is ready.
 * @param {string=} args.globalStylesId      Current global styles entity id.
 * @param {boolean} args.canEditGlobalStyles `canUser( 'update', … )` result.
 * @return {boolean} Whether editing is available.
 */
export function getCanManage( {
	isReady,
	globalStylesId,
	canEditGlobalStyles,
} ) {
	return isReady && !! globalStylesId && !! canEditGlobalStyles;
}

/**
 * Provides the inspector color picker with origin-aware palette editing:
 * full CRUD for custom colors, value-only edits for theme/default palettes.
 *
 * Relies on experimental core-data selectors
 * (`__experimentalGetCurrentGlobalStylesId`,
 * `__experimentalGetCurrentThemeBaseGlobalStyles`) for entity identity and
 * baseline palette reads.
 *
 * Each callback applies an optimistic edit, persists *only* the palette
 * slice of `settings` (so unrelated dirty global-styles edits like typography
 * stay dirty), and surfaces a success/error snackbar.
 *
 * @return {Object} Object with `colorEditing` shaped for `ColorPalette`, or
 *                  `undefined` when editing isn't available.
 */
export default function useColorPaletteEditing() {
	const {
		merged,
		setUser: setUserGlobalStyles,
		isReady: isGlobalStylesReady,
	} = useGlobalStyles();

	const globalStylesId = useSelect(
		( select ) =>
			select( coreStore ).__experimentalGetCurrentGlobalStylesId(),
		[]
	);

	const canEditGlobalStyles = useSelect(
		( select ) =>
			globalStylesId
				? select( coreStore ).canUser( 'update', {
						kind: 'root',
						name: 'globalStyles',
						id: globalStylesId,
				  } )
				: false,
		[ globalStylesId ]
	);

	const registry = useRegistry();
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );

	const canManage = getCanManage( {
		isReady: isGlobalStylesReady,
		globalStylesId,
		canEditGlobalStyles,
	} );

	const themePalette = merged?.settings?.color?.palette?.theme;
	const defaultPalette = merged?.settings?.color?.palette?.default;
	const defaultPaletteEnabled =
		merged?.settings?.color?.defaultPalette !== false;

	const hasThemePalette = !! themePalette?.length;
	const hasDefaultPalette =
		defaultPaletteEnabled && !! defaultPalette?.length;

	const capabilities = useMemo(
		() => ( {
			custom: 'full',
			...( hasThemePalette ? { theme: 'value' } : {} ),
			...( hasDefaultPalette ? { default: 'value' } : {} ),
		} ),
		[ hasThemePalette, hasDefaultPalette ]
	);

	const getBaseOriginPalette = useCallback(
		( paletteSlug ) =>
			registry
				.select( coreStore )
				.__experimentalGetCurrentThemeBaseGlobalStyles()?.settings
				?.color?.palette?.[ paletteSlug ] ?? [],
		[ registry ]
	);

	const getMergedOriginPalette = useCallback(
		( paletteSlug ) => {
			const edited = registry
				.select( coreStore )
				.getEditedEntityRecord(
					'root',
					'globalStyles',
					globalStylesId
				);
			return (
				edited?.settings?.color?.palette?.[ paletteSlug ] ??
				getBaseOriginPalette( paletteSlug )
			);
		},
		[ registry, globalStylesId, getBaseOriginPalette ]
	);

	// Persist a palette change to the server without touching any other
	// unsaved edits the user may have on the global-styles entity. The Global
	// Styles REST controller replaces `settings` wholesale, so we have to send
	// a *full* settings object. Reading the settings off the saved baseline
	// (rather than the locally edited record) keeps unrelated pending edits
	// dirty, exactly as the user expects.
	const persistPalette = useCallback(
		async ( paletteSlug, nextPalette ) => {
			if ( ! globalStylesId ) {
				return;
			}

			const savedRecord = registry
				.select( coreStore )
				.getEntityRecord( 'root', 'globalStyles', globalStylesId );

			if ( ! savedRecord ) {
				return;
			}

			const palettePath = PALETTE_PATHS[ paletteSlug ];
			let paletteValue = nextPalette;

			// For custom, an empty array removes the override. For theme/default,
			// only persist undefined when the override matches the base palette.
			if ( paletteSlug === 'custom' ) {
				paletteValue = nextPalette?.length ? nextPalette : undefined;
			} else if (
				fastDeepEqual(
					nextPalette,
					getBaseOriginPalette( paletteSlug )
				)
			) {
				paletteValue = undefined;
			}

			const finalGlobalStyles = setImmutably(
				savedRecord ?? {},
				palettePath,
				paletteValue
			);

			return registry
				.dispatch( coreStore )
				.saveEntityRecord( 'root', 'globalStyles', finalGlobalStyles, {
					throwOnError: true,
				} );
		},
		[ globalStylesId, registry, getBaseOriginPalette ]
	);

	const applyAndPersistPalette = useCallback(
		async ( paletteSlug, computeNext, notices ) => {
			if ( ! globalStylesId ) {
				return;
			}

			const canEdit = registry.select( coreStore ).canUser( 'update', {
				kind: 'root',
				name: 'globalStyles',
				id: globalStylesId,
			} );
			if ( ! canEdit ) {
				return;
			}

			const palettePath = PALETTE_PATHS[ paletteSlug ];
			const editedRecord = registry
				.select( coreStore )
				.getEditedEntityRecord(
					'root',
					'globalStyles',
					globalStylesId
				);
			const previousPalette =
				editedRecord?.settings?.color?.palette?.[ paletteSlug ];
			const nextPalette = computeNext(
				paletteSlug === 'custom'
					? previousPalette ?? []
					: previousPalette
			);

			const optimisticValue = getOptimisticPaletteValue(
				paletteSlug,
				nextPalette,
				getBaseOriginPalette( paletteSlug )
			);

			setUserGlobalStyles( ( prev ) =>
				setImmutably( prev ?? {}, palettePath, optimisticValue )
			);

			try {
				await persistPalette( paletteSlug, nextPalette );
				createSuccessNotice( notices.success, {
					type: 'snackbar',
					id: COLOR_PALETTE_NOTICE_ID,
				} );
			} catch {
				setUserGlobalStyles( ( prev ) =>
					setImmutably(
						prev ?? {},
						palettePath,
						getRollbackPaletteValue( paletteSlug, previousPalette )
					)
				);
				createErrorNotice( notices.error, {
					type: 'snackbar',
					id: COLOR_PALETTE_NOTICE_ID,
				} );
			}
		},
		[
			globalStylesId,
			registry,
			setUserGlobalStyles,
			persistPalette,
			getBaseOriginPalette,
			createSuccessNotice,
			createErrorNotice,
		]
	);

	const onAdd = useCallback(
		( { paletteSlug, name, nextSlug, color } ) => {
			if ( paletteSlug !== 'custom' ) {
				return;
			}
			return applyAndPersistPalette(
				'custom',
				( current ) => [ ...current, { name, slug: nextSlug, color } ],
				{
					success: sprintf(
						// translators: %s: name of the custom color, e.g. "Brand Red".
						__( 'Custom color "%s" added.' ),
						name
					),
					error: sprintf(
						// translators: %s: name of the custom color, e.g. "Brand Red".
						__( 'Failed to add custom color "%s".' ),
						name
					),
				}
			);
		},
		[ applyAndPersistPalette ]
	);

	const onUpdate = useCallback(
		( { paletteSlug, slug, nextSlug, name, color } ) => {
			if ( paletteSlug === 'custom' ) {
				return applyAndPersistPalette(
					'custom',
					( current ) =>
						current.map( ( entry ) =>
							entry.slug === slug
								? { ...entry, name, slug: nextSlug, color }
								: entry
						),
					{
						success: sprintf(
							// translators: %s: name of the custom color, e.g. "Brand Red".
							__( 'Custom color "%s" updated.' ),
							name
						),
						error: sprintf(
							// translators: %s: name of the custom color, e.g. "Brand Red".
							__( 'Failed to update custom color "%s".' ),
							name
						),
					}
				);
			}

			const mergedOriginPalette = getMergedOriginPalette( paletteSlug );
			return applyAndPersistPalette(
				paletteSlug,
				() =>
					mergedOriginPalette.map( ( entry ) =>
						entry.slug === slug ? { ...entry, color } : entry
					),
				{
					success: sprintf(
						// translators: %s: name of the color, e.g. "Brand".
						__( 'Color "%s" updated.' ),
						name
					),
					error: sprintf(
						// translators: %s: name of the color, e.g. "Brand".
						__( 'Failed to update color "%s".' ),
						name
					),
				}
			);
		},
		[ applyAndPersistPalette, getMergedOriginPalette ]
	);

	const onDelete = useCallback(
		( { paletteSlug, slug } ) => {
			if ( paletteSlug !== 'custom' ) {
				return;
			}

			const editedRecord = registry
				.select( coreStore )
				.getEditedEntityRecord(
					'root',
					'globalStyles',
					globalStylesId
				);
			const previousCustom =
				editedRecord?.settings?.color?.palette?.custom ?? [];
			const removed = previousCustom.find(
				( entry ) => entry.slug === slug
			);
			const removedName = removed?.name ?? slug;

			return applyAndPersistPalette(
				'custom',
				( current ) =>
					current.filter( ( entry ) => entry.slug !== slug ),
				{
					success: sprintf(
						// translators: %s: name of the custom color, e.g. "Brand Red".
						__( 'Custom color "%s" deleted.' ),
						removedName
					),
					error: sprintf(
						// translators: %s: name of the custom color, e.g. "Brand Red".
						__( 'Failed to delete custom color "%s".' ),
						removedName
					),
				}
			);
		},
		[ applyAndPersistPalette, globalStylesId, registry ]
	);

	const colorEditing = useMemo(
		() =>
			canManage ? { capabilities, onAdd, onUpdate, onDelete } : undefined,
		[ canManage, capabilities, onAdd, onUpdate, onDelete ]
	);

	return { colorEditing };
}
