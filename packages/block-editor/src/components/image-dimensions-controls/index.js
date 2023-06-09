/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { InspectorControls } from '../inspector-controls';
import AspectRatioItem from './aspect-ratio';
import DimensionsItem from './dimensions';
import ResolutionItem from './resolution';
import ScaleItem from './scale';

export default function ImageDimensionsControl( {
	panelId,
	value,
	onChange,
	availableUnits,
	sizeOptions,
	defaultSizeValue,
	scaleOptions,
	defaultScaleValue,
	aspectRatioOptions,
	defaultAspectRatioValue,
	...props
} ) {
	return (
		<InspectorControls group="dimensions" { ...props }>
			<ResolutionItem
				panelId={ panelId }
				value={ value.resolution }
				onChange={ ( resolution ) =>
					onChange( { ...value, resolution } )
				}
				options={ sizeOptions }
				defaultValue={ defaultSizeValue }
			/>
			<DimensionsItem
				panelId={ panelId }
				value={ value.dimensions }
				onChange={ ( dimensions ) =>
					onChange( { ...value, dimensions } )
				}
				availableUnits={ availableUnits }
			/>
			<ScaleItem
				panelId={ panelId }
				value={ value.scale }
				onChange={ ( scale ) => onChange( { ...value, scale } ) }
				options={ scaleOptions }
				defaultValue={ defaultScaleValue }
			/>
			<AspectRatioItem
				panelId={ panelId }
				value={ value.aspectRatio }
				onChange={ ( aspectRatio ) =>
					onChange( { ...value, aspectRatio } )
				}
				options={ aspectRatioOptions }
				defaultValue={ defaultAspectRatioValue }
			/>
		</InspectorControls>
	);
}
