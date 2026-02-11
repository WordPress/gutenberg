/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo, useState } from '@wordpress/element';
import {
	__experimentalGrid as Grid,
	__experimentalVStack as VStack,
	Spinner,
	Tooltip,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { ENTER } from '@wordpress/keycodes';
import clsx from 'clsx';
import { mergeGlobalStyles } from '@wordpress/global-styles-engine';

/**
 * Internal dependencies
 */
import PreviewStyles from './preview-styles';
import { GlobalStylesContext } from './context';
import { Subtitle } from './subtitle';

interface RegisteredStyleVariation {
	id: string;
	title: string;
	settings?: Record< string, unknown >;
	styles?: Record< string, unknown >;
	base_theme?: string | null;
	source?: string;
	post_id?: number | null;
}

interface TemplateStyleVariationPickerProps {
	/**
	 * The currently selected style variation ID (string like 'demo//dark-mode').
	 */
	currentStyleVariationId?: string | null;
	/**
	 * Callback when a style variation is selected.
	 * Receives the variation string ID or null for default.
	 */
	onSelect?: ( variationId: string | null ) => void;
	/**
	 * Gap between variation previews.
	 */
	gap?: number;
}

interface VariationPreviewProps {
	variation: RegisteredStyleVariation;
	isSelected: boolean;
	onSelect: () => void;
	baseConfig: Record< string, unknown >;
}

/**
 * A single variation preview that provides its own context for rendering.
 *
 * @param props            Component props.
 * @param props.variation  The registered style variation to preview.
 * @param props.isSelected Whether this variation is currently selected.
 * @param props.onSelect   Callback invoked when the variation is selected.
 * @param props.baseConfig The base global styles config for merging.
 */
function VariationPreview( {
	variation,
	isSelected,
	onSelect,
	baseConfig,
}: VariationPreviewProps ) {
	const [ isFocused, setIsFocused ] = useState( false );

	// When the variation has a wp_global_styles post, fetch user-edited data.
	const postData = useSelect(
		( select ) => {
			if ( ! variation.post_id ) {
				return null;
			}
			const coreSelectors = select( coreStore ) as Record<
				string,
				unknown
			>;
			const getEditedEntityRecord =
				coreSelectors.getEditedEntityRecord as (
					kind: string,
					name: string,
					recordId: number
				) => Record< string, unknown > | undefined;
			return getEditedEntityRecord(
				'root',
				'globalStyles',
				variation.post_id
			);
		},
		[ variation.post_id ]
	);

	// Use post data when available (user edits), falling back to registered data.
	const effectiveSettings = useMemo(
		() => postData?.settings || variation.settings || {},
		[ postData?.settings, variation.settings ]
	);
	const effectiveStyles = useMemo(
		() => postData?.styles || variation.styles || {},
		[ postData?.styles, variation.styles ]
	);

	// Create a context with the variation's styles merged with base
	const context = useMemo( () => {
		const variationConfig = {
			settings: effectiveSettings,
			styles: effectiveStyles,
		};
		const merged = mergeGlobalStyles( baseConfig, variationConfig );

		return {
			user: variationConfig,
			base: baseConfig,
			merged,
			onChange: () => {},
		};
	}, [ effectiveSettings, effectiveStyles, baseConfig ] );

	const handleKeyDown = ( event: React.KeyboardEvent ) => {
		if ( event.keyCode === ENTER ) {
			event.preventDefault();
			onSelect();
		}
	};

	return (
		<GlobalStylesContext.Provider value={ context }>
			<Tooltip text={ variation.title }>
				<div
					className={ clsx(
						'global-styles-ui-variations_item',
						'global-styles-ui-template-variation-preview',
						{
							'is-active': isSelected,
						}
					) }
					role="button"
					onClick={ onSelect }
					onKeyDown={ handleKeyDown }
					tabIndex={ 0 }
					aria-label={ variation.title }
					aria-current={ isSelected }
					onFocus={ () => setIsFocused( true ) }
					onBlur={ () => setIsFocused( false ) }
				>
					<div className="global-styles-ui-variations_item-preview">
						<PreviewStyles
							label={ variation.title }
							withHoverView
							isFocused={ isFocused || isSelected }
							variation={ {
								title: variation.title,
								settings: effectiveSettings,
								styles: effectiveStyles,
							} }
						/>
					</div>
				</div>
			</Tooltip>
		</GlobalStylesContext.Provider>
	);
}

/**
 * A component for selecting a style variation to assign to a template.
 *
 * This component displays all registered style variations with visual previews
 * and allows assigning one to a specific template. When a variation is assigned,
 * that variation's global styles will be used when rendering the template.
 *
 * @param props                         Component props.
 * @param props.currentStyleVariationId The currently selected style variation ID.
 * @param props.onSelect                Callback invoked when a variation is selected.
 * @param props.gap                     Gap between variation previews.
 * @example
 * ```tsx
 * <TemplateStyleVariationPicker
 *   currentStyleVariationId="demo//dark-mode"
 *   onSelect={(id) => console.log('Selected variation:', id)}
 * />
 * ```
 */
export function TemplateStyleVariationPicker( {
	currentStyleVariationId,
	onSelect,
	gap = 2,
}: TemplateStyleVariationPickerProps ) {
	const { registeredVariations, isLoading, baseConfig } = useSelect(
		( select ) => {
			// Cast to any to access experimental selectors that aren't in the public type definitions.
			const coreSelectors = select( coreStore ) as Record<
				string,
				unknown
			>;
			const __experimentalGetRegisteredStyleVariations =
				coreSelectors.__experimentalGetRegisteredStyleVariations as
					| ( () => RegisteredStyleVariation[] )
					| undefined;
			const hasFinishedResolution =
				coreSelectors.hasFinishedResolution as
					| ( ( selector: string, args: unknown[] ) => boolean )
					| undefined;
			const __experimentalGetCurrentThemeBaseGlobalStyles =
				coreSelectors.__experimentalGetCurrentThemeBaseGlobalStyles as
					| ( () => Record< string, unknown > )
					| undefined;

			// Try to get registered style variations.
			let variations: RegisteredStyleVariation[] = [];
			try {
				variations =
					__experimentalGetRegisteredStyleVariations?.() || [];
			} catch {
				// Selector might not exist if experiment is not enabled.
				variations = [];
			}

			// Get base global styles for proper preview rendering.
			let base: Record< string, unknown > = {};
			try {
				base = __experimentalGetCurrentThemeBaseGlobalStyles?.() || {};
			} catch {
				// Selector might not exist.
				base = {};
			}

			// Check if we're still loading.
			const hasFinished =
				hasFinishedResolution?.(
					'__experimentalGetRegisteredStyleVariations',
					[]
				) ?? true;

			return {
				registeredVariations: variations,
				isLoading: ! hasFinished,
				baseConfig: base,
			};
		},
		[]
	);

	// Build grouped variations: default, theme, and other (custom/plugin).
	const { defaultVariation, themeVariations, otherVariations } =
		useMemo( () => {
			const def: RegisteredStyleVariation = {
				id: '',
				title: __( 'Default (Global Styles)' ),
				settings: {},
				styles: {},
				source: 'default',
			};

			const theme: RegisteredStyleVariation[] = [];
			const other: RegisteredStyleVariation[] = [];

			for ( const variation of registeredVariations ) {
				if ( variation.source === 'theme' ) {
					theme.push( variation );
				} else {
					other.push( variation );
				}
			}

			return {
				defaultVariation: def,
				themeVariations: theme,
				otherVariations: other,
			};
		}, [ registeredVariations ] );

	if ( isLoading ) {
		return (
			<VStack alignment="center" spacing={ 4 }>
				<Spinner />
			</VStack>
		);
	}

	if ( registeredVariations.length === 0 ) {
		return null;
	}

	const showSubtitles =
		themeVariations.length > 0 && otherVariations.length > 0;

	const renderVariation = ( variation: RegisteredStyleVariation ) => {
		const isSelected =
			variation.id === ''
				? ! currentStyleVariationId
				: variation.id === currentStyleVariationId;

		return (
			<VariationPreview
				key={ variation.id || 'default' }
				variation={ variation }
				isSelected={ isSelected }
				baseConfig={ baseConfig }
				onSelect={ () => {
					onSelect?.( variation.id === '' ? null : variation.id );
				} }
			/>
		);
	};

	return (
		<VStack
			className="global-styles-ui-template-style-variation-picker"
			spacing={ 4 }
		>
			<Grid columns={ 2 } gap={ gap }>
				{ renderVariation( defaultVariation ) }
			</Grid>
			{ themeVariations.length > 0 && (
				<VStack spacing={ 3 }>
					{ showSubtitles && (
						<Subtitle level={ 3 }>{ __( 'Theme' ) }</Subtitle>
					) }
					<Grid columns={ 2 } gap={ gap }>
						{ themeVariations.map( renderVariation ) }
					</Grid>
				</VStack>
			) }
			{ otherVariations.length > 0 && (
				<VStack spacing={ 3 }>
					{ showSubtitles && (
						<Subtitle level={ 3 }>{ __( 'Custom' ) }</Subtitle>
					) }
					<Grid columns={ 2 } gap={ gap }>
						{ otherVariations.map( renderVariation ) }
					</Grid>
				</VStack>
			) }
		</VStack>
	);
}

export default TemplateStyleVariationPicker;
