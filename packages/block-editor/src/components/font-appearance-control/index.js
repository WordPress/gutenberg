/**
 * WordPress dependencies
 */
import { CustomSelectControl } from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Control to display unified font style and weight options.
 *
 * @param  {Object}   props Component props.
 * @return {WPElement}      Font appearance control.
 */
export default function FontAppearanceControl( props ) {
	const {
		onChange,
		options: { fontStyles = [], fontWeights = [] },
		value: { fontStyle, fontWeight },
	} = props;
	const hasStyles = !! fontStyles.length;
	const hasWeights = !! fontWeights.length;
	const hasStylesOrWeights = hasStyles || hasWeights;
	const defaultOption = {
		key: 'default',
		name: __( 'Default' ),
		style: { fontStyle: undefined, fontWeight: undefined },
	};

	// Combines both font style and weight options into a single dropdown.
	const combineOptions = () => {
		const combinedOptions = [ defaultOption ];

		fontStyles.forEach( ( { name: styleName, slug: styleSlug } ) => {
			fontWeights.forEach( ( { name: weightName, slug: weightSlug } ) => {
				const optionName =
					styleSlug === 'normal'
						? weightName
						: sprintf(
								/* translators: 1: Font weight name. 2: Font style name. */
								__( '%1$s %2$s' ),
								weightName,
								styleName
						  );

				combinedOptions.push( {
					key: `${ weightSlug }-${ styleSlug }`,
					name: optionName,
					style: { fontStyle: styleSlug, fontWeight: weightSlug },
				} );
			} );
		} );

		return combinedOptions;
	};

	// Generates select options for font styles only.
	const styleOptions = () => {
		const combinedOptions = [ defaultOption ];
		fontStyles.forEach( ( { name, slug } ) => {
			combinedOptions.push( {
				key: slug,
				name,
				style: { fontStyle: slug, fontWeight: undefined },
			} );
		} );
		return combinedOptions;
	};

	// Generates select options for font weights only.
	const weightOptions = () => {
		const combinedOptions = [ defaultOption ];
		fontWeights.forEach( ( { name, slug } ) => {
			combinedOptions.push( {
				key: slug,
				name,
				style: { fontStyle: undefined, fontWeight: slug },
			} );
		} );
		return combinedOptions;
	};

	// Map font styles and weights to select options.
	const selectOptions = useMemo( () => {
		if ( hasStyles && hasWeights ) {
			return combineOptions();
		}

		return hasStyles ? styleOptions() : weightOptions();
	}, [ props.options ] );

	// Find current selection by comparing font style & weight against options.
	const currentSelection = selectOptions.find(
		( option ) =>
			option.style.fontStyle === fontStyle &&
			option.style.fontWeight === fontWeight
	);

	// Adjusts field label in case either styles or weights are disabled.
	const getLabel = () => {
		if ( ! hasStyles ) {
			return __( 'Font weight' );
		}

		if ( ! hasWeights ) {
			return __( 'Font style' );
		}

		return __( 'Appearance' );
	};

	return (
		<fieldset className="components-font-appearance-control">
			{ hasStylesOrWeights && (
				<CustomSelectControl
					className="components-font-appearance-control__select"
					label={ getLabel() }
					options={ selectOptions }
					value={ currentSelection }
					onChange={ ( { selectedItem } ) =>
						onChange( selectedItem.style )
					}
				/>
			) }
		</fieldset>
	);
}
