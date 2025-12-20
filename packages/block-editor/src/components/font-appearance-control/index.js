/**
 * WordPress dependencies
 */
import { CustomSelectControl } from '@wordpress/components';
import deprecated from '@wordpress/deprecated';
import { useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getFontStylesAndWeights } from '../../utils/get-font-styles-and-weights';

/**
 * Adjusts font appearance field label in case either font styles or weights
 * are disabled.
 *
 * @param {boolean} hasFontStyles  Whether font styles are enabled and present.
 * @param {boolean} hasFontWeights Whether font weights are enabled and present.
 * @return {string} A label representing what font appearance is being edited.
 */
const getFontAppearanceLabel = ( hasFontStyles, hasFontWeights ) => {
	if ( ! hasFontStyles ) {
		return __( 'Font weight' );
	}

	if ( ! hasFontWeights ) {
		return __( 'Font style' );
	}

	return __( 'Appearance' );
};

/**
 * Control to display font style and weight options of the active font.
 *
 * @param {Object} props Component props.
 *
 * @return {Element} Font appearance control.
 */
export default function FontAppearanceControl( props ) {
	const {
		/** Start opting into the larger default height that will become the default size in a future version. */
		__next40pxDefaultSize = false,
		onChange,
		hasFontStyles = true,
		hasFontWeights = true,
		fontFamilyFaces,
		value: { fontStyle, fontWeight },
		...otherProps
	} = props;
	const hasStylesOrWeights = hasFontStyles || hasFontWeights;
	const label = getFontAppearanceLabel( hasFontStyles, hasFontWeights );
	const defaultOption = {
		key: 'default',
		name: __( 'Default' ),
		style: { fontStyle: undefined, fontWeight: undefined },
	};
	const { fontStyles, fontWeights, combinedStyleAndWeightOptions } =
		getFontStylesAndWeights( fontFamilyFaces );

	// Generates select options for combined font styles and weights.
	const combineOptions = () => {
		const combinedOptions = [ defaultOption ];
		if ( combinedStyleAndWeightOptions ) {
			combinedOptions.push( ...combinedStyleAndWeightOptions );
		}
		return combinedOptions;
	};

	// Generates select options for font styles only.
	const styleOptions = () => {
		const combinedOptions = [ defaultOption ];
		fontStyles.forEach( ( { name, value } ) => {
			combinedOptions.push( {
				key: value,
				name,
				style: { fontStyle: value, fontWeight: undefined },
			} );
		} );
		return combinedOptions;
	};

	// Generates select options for font weights only.
	const weightOptions = () => {
		const combinedOptions = [ defaultOption ];
		fontWeights.forEach( ( { name, value } ) => {
			combinedOptions.push( {
				key: value,
				name,
				style: { fontStyle: undefined, fontWeight: value },
			} );
		} );
		return combinedOptions;
	};

	// Map font styles and weights to select options.
	const selectOptions = useMemo( () => {
		// Display combined available font style and weight options.
		if ( hasFontStyles && hasFontWeights ) {
			return combineOptions();
		}

		// Display only font style options or font weight options.
		return hasFontStyles ? styleOptions() : weightOptions();
	}, [
		props.options,
		fontStyles,
		fontWeights,
		combinedStyleAndWeightOptions,
	] );

	// Find current selection by comparing font style & weight against options,
	// and fall back to the Default option if there is no matching option.
	const currentSelection =
		selectOptions.find(
			( option ) =>
				option.style.fontStyle === fontStyle &&
				option.style.fontWeight === fontWeight
		) || selectOptions[ 0 ];

	// Adjusts screen reader description based on styles or weights.
	const getDescribedBy = () => {
		if ( ! currentSelection ) {
			return __( 'No selected font appearance' );
		}

		if ( ! hasFontStyles ) {
			return sprintf(
				// translators: %s: Currently selected font weight.
				__( 'Currently selected font weight: %s' ),
				currentSelection.name
			);
		}

		if ( ! hasFontWeights ) {
			return sprintf(
				// translators: %s: Currently selected font style.
				__( 'Currently selected font style: %s' ),
				currentSelection.name
			);
		}

		return sprintf(
			// translators: %s: Currently selected font appearance.
			__( 'Currently selected font appearance: %s' ),
			currentSelection.name
		);
	};

	if (
		! __next40pxDefaultSize &&
		( otherProps.size === undefined || otherProps.size === 'default' )
	) {
		deprecated(
			`36px default size for wp.blockEditor.__experimentalFontAppearanceControl`,
			{
				since: '6.8',
				version: '7.1',
				hint: 'Set the `__next40pxDefaultSize` prop to true to start opting into the new default size, which will become the default in a future version.',
			}
		);
	}

	return (
		hasStylesOrWeights && (
			<CustomSelectControl
				{ ...otherProps }
				className="components-font-appearance-control"
				__next40pxDefaultSize={ __next40pxDefaultSize }
				__shouldNotWarnDeprecated36pxSize
				label={ label }
				describedBy={ getDescribedBy() }
				options={ selectOptions }
				value={ currentSelection }
				onChange={ ( { selectedItem } ) =>
					onChange( selectedItem.style )
				}
			/>
		)
	);
}
