import { Field, Select } from '@wordpress/ui';
import { __ } from '@wordpress/i18n';
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
		/**
		 * Start opting into the larger default height that will become the default size in a future version.
		 *
		 * @deprecated Default behavior since WordPress 7.1. Prop can be safely removed.
		 */
		__next40pxDefaultSize: _next40pxDefaultSize,
		onChange,
		hasFontStyles = true,
		hasFontWeights = true,
		fontFamilyFaces,
		value: { fontStyle, fontWeight },
		hideLabelFromVision,
		size,
		disabled,
		className: _className,
		label: _label,
		describedBy: _describedBy,
		options: _options,
		showSelectedHint: _showSelectedHint,
		__experimentalShowSelectedHint: _experimentalShowSelectedHint,
		__nextUnconstrainedWidth: _nextUnconstrainedWidth,
		__nextHasNoMarginBottom: _nextHasNoMarginBottom,
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
	let selectOptions;
	if ( hasFontStyles && hasFontWeights ) {
		selectOptions = combineOptions();
	} else if ( hasFontStyles ) {
		selectOptions = styleOptions();
	} else {
		selectOptions = weightOptions();
	}

	// Find current selection by comparing font style & weight against options,
	// and fall back to the Default option if there is no matching option.
	const items = selectOptions.map( ( option ) => ( {
		value: option.key,
		label: option.name,
		style: option.style,
	} ) );
	const currentSelection =
		items.find(
			( option ) =>
				option.style.fontStyle === fontStyle &&
				option.style.fontWeight === fontWeight
		) || items[ 0 ];

	return (
		hasStylesOrWeights && (
			<Field.Root
				className="components-font-appearance-control"
				disabled={ disabled }
			>
				<Field.Label
					className="block-editor-font-appearance-control__label"
					hideFromVision={ hideLabelFromVision }
				>
					{ label }
				</Field.Label>
				<Select.Root
					value={ currentSelection }
					onValueChange={ ( selectedItem ) =>
						onChange( selectedItem?.style ?? items[ 0 ].style )
					}
					items={ items }
					disabled={ disabled }
				>
					<Select.Trigger size={ size } { ...otherProps } />
					<Select.Popup width="content">
						{ items.map( ( item ) => (
							<Select.Item key={ item.value } value={ item }>
								<Select.ItemLabel
									className="components-font-appearance-control__option"
									style={ item.style }
								>
									{ item.label }
								</Select.ItemLabel>
							</Select.Item>
						) ) }
					</Select.Popup>
				</Select.Root>
			</Field.Root>
		)
	);
}
