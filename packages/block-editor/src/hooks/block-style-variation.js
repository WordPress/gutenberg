/**
 * WordPress dependencies
 */
import { getBlockTypes, store as blocksStore } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import {
	toStyles,
	getBlockSelectors,
	privateApis as globalStylesEnginePrivateApis,
} from '@wordpress/global-styles-engine';

/**
 * Internal dependencies
 */
import { usePrivateStyleOverride } from './utils';
import { store as blockEditorStore } from '../store';
import { globalStylesDataKey } from '../store/private-keys';
import { unlock } from '../lock-unlock';

const { getVariationStyle } = unlock( globalStylesEnginePrivateApis );

const VARIATION_PREFIX = 'is-style-';

function getVariationMatches( className ) {
	if ( ! className ) {
		return [];
	}
	return className.split( /\s+/ ).reduce( ( matches, name ) => {
		if ( name.startsWith( VARIATION_PREFIX ) ) {
			const match = name.slice( VARIATION_PREFIX.length );
			if ( match !== 'default' ) {
				matches.push( match );
			}
		}
		return matches;
	}, [] );
}

/**
 * Get the first block style variation that has been registered from the class string.
 *
 * @param {string} className        CSS class string for a block.
 * @param {Array}  registeredStyles Currently registered block styles.
 *
 * @return {string|null} The name of the first registered variation.
 */
export function getVariationNameFromClass( className, registeredStyles = [] ) {
	// The global flag affects how capturing groups work in JS. So the regex
	// below will only return full CSS classes not just the variation name.
	const matches = getVariationMatches( className );

	if ( ! matches ) {
		return null;
	}

	for ( const variation of matches ) {
		if ( registeredStyles.some( ( style ) => style.name === variation ) ) {
			return variation;
		}
	}
	return null;
}

// A helper component to apply a style override using the useStyleOverride hook.
function OverrideStyles( { override } ) {
	usePrivateStyleOverride( override );
}

/**
 * This component is used to generate new block style variation overrides
 * based on an incoming theme config. If a matching style is found in the config,
 * a new override is created and returned. The overrides can be used in conjunction with
 * useStyleOverride to apply the new styles to the editor. Its use is
 * subject to change.
 *
 * @param {Object} props        Props.
 * @param {Object} props.config A global styles object, containing settings and styles.
 * @return {React.JSX.Element}  An array of new block variation overrides.
 */
export function BlockStyleVariationOverridesWithConfig( { config } ) {
	const { overrides } = useSelect(
		( select ) => ( {
			overrides: unlock( select( blockEditorStore ) ).getStyleOverrides(),
		} ),
		[]
	);
	const { getBlockName } = useSelect( blockEditorStore );

	const overridesWithConfig = useMemo( () => {
		if ( ! overrides?.length ) {
			return;
		}
		const newOverrides = [];
		const overriddenClientIds = [];
		for ( const [ , override ] of overrides ) {
			if (
				override?.variation &&
				override?.clientId &&
				/*
				 * Because this component overwrites existing style overrides,
				 * filter out any overrides that are already present in the store.
				 */
				! overriddenClientIds.includes( override.clientId )
			) {
				const blockName = getBlockName( override.clientId );
				const configStyles =
					config?.styles?.blocks?.[ blockName ]?.variations?.[
						override.variation
					];
				if ( configStyles ) {
					const variationConfig = {
						settings: config?.settings,
						// The variation style data is all that is needed to generate
						// the styles for the current application to a block. The variation
						// name is updated to match the instance specific class name.
						styles: {
							blocks: {
								[ blockName ]: {
									variations: {
										[ `${ override.variation }-${ override.clientId }` ]:
											configStyles,
									},
								},
							},
						},
					};
					const blockSelectors = getBlockSelectors(
						getBlockTypes(),
						override.clientId
					);
					const hasBlockGapSupport = false;
					const hasFallbackGapSupport = true;
					const disableLayoutStyles = true;
					const disableRootPadding = true;
					const variationStyles = toStyles(
						variationConfig,
						blockSelectors,
						hasBlockGapSupport,
						hasFallbackGapSupport,
						disableLayoutStyles,
						disableRootPadding,
						{
							blockGap: false,
							blockStyles: true,
							layoutStyles: false,
							marginReset: false,
							presets: false,
							rootPadding: false,
							variationStyles: true,
						}
					);
					newOverrides.push( {
						id: `${ override.variation }-${ override.clientId }`,
						css: variationStyles,
						__unstableType: 'variation',
						variation: override.variation,
						// The clientId will be stored with the override and used to ensure
						// the order of overrides matches the order of blocks so that the
						// correct CSS cascade is maintained.
						clientId: override.clientId,
					} );
					overriddenClientIds.push( override.clientId );
				}
			}
		}
		return newOverrides;
	}, [ config, overrides, getBlockName ] );

	if ( ! overridesWithConfig || ! overridesWithConfig.length ) {
		return null;
	}

	return (
		<>
			{ overridesWithConfig.map( ( override ) => (
				<OverrideStyles key={ override.id } override={ override } />
			) ) }
		</>
	);
}

function useBlockStyleVariation( name, variation, clientId ) {
	const { globalSettings, globalStyles } = useSelect( ( select ) => {
		const settings = select( blockEditorStore ).getSettings();
		return {
			globalSettings: settings.__experimentalFeatures,
			globalStyles: settings[ globalStylesDataKey ],
		};
	}, [] );

	return useMemo( () => {
		const variationStyles = getVariationStyle(
			{
				settings: globalSettings,
				styles: globalStyles,
			},
			name,
			variation
		);

		return {
			settings: globalSettings,
			// The variation style data is all that is needed to generate
			// the styles for the current application to a block. The variation
			// name is updated to match the instance specific class name.
			styles: {
				blocks: {
					[ name ]: {
						variations: {
							[ `${ variation }-${ clientId }` ]: variationStyles,
						},
					},
				},
			},
		};
	}, [ globalSettings, globalStyles, variation, clientId, name ] );
}

// Rather than leveraging `useInstanceId` here, the `clientId` is used.
// This is so that the variation style override's ID is predictable
// when the order of applied style variations changes.
function useBlockProps( { name, className, clientId } ) {
	const { getBlockStyles } = useSelect( blocksStore );

	const registeredStyles = getBlockStyles( name );
	const variation = getVariationNameFromClass( className, registeredStyles );
	const variationClass = `${ VARIATION_PREFIX }${ variation }-${ clientId }`;

	const { settings, styles } = useBlockStyleVariation(
		name,
		variation,
		clientId
	);

	const variationStyles = useMemo( () => {
		if ( ! variation ) {
			return;
		}

		const variationConfig = { settings, styles };
		const blockSelectors = getBlockSelectors( getBlockTypes(), clientId );
		const hasBlockGapSupport = false;
		const hasFallbackGapSupport = true;
		const disableLayoutStyles = true;
		const disableRootPadding = true;

		return toStyles(
			variationConfig,
			blockSelectors,
			hasBlockGapSupport,
			hasFallbackGapSupport,
			disableLayoutStyles,
			disableRootPadding,
			{
				blockGap: false,
				blockStyles: true,
				layoutStyles: false,
				marginReset: false,
				presets: false,
				rootPadding: false,
				variationStyles: true,
			}
		);
	}, [ variation, settings, styles, clientId ] );

	usePrivateStyleOverride( {
		id: `variation-${ clientId }`,
		css: variationStyles,
		__unstableType: 'variation',
		variation,
		// The clientId will be stored with the override and used to ensure
		// the order of overrides matches the order of blocks so that the
		// correct CSS cascade is maintained.
		clientId,
	} );

	return variation ? { className: variationClass } : {};
}

export default {
	hasSupport: () => true,
	attributeKeys: [ 'className' ],
	isMatch: ( { className } ) => getVariationMatches( className ).length > 0,
	useBlockProps,
};
