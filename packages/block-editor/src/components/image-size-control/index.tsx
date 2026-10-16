import {
	__experimentalNumberControl as NumberControl,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { SelectControl } from '@wordpress/ui';
import { __, sprintf } from '@wordpress/i18n';
import useDimensionHandler from './use-dimension-handler';
import type { ImageSizeControlProps } from './types';

const IMAGE_SIZE_PRESETS = [ 25, 50, 75, 100 ];
const noop = () => {};

/**
 * Get scaled width and height for the given scale.
 *
 * @param scale       The scale to get the scaled width and height for.
 * @param imageWidth  The image width.
 * @param imageHeight The image height.
 *
 * @return The scaled width and height.
 */
function getScaledWidthAndHeight(
	scale: number,
	imageWidth: number | string | undefined,
	imageHeight: number | string | undefined
) {
	// A string size is coerced and an unknown one scales to `NaN`, as before.
	const scaledWidth = Math.round(
		( imageWidth as number ) * ( scale / 100 )
	);
	const scaledHeight = Math.round(
		( imageHeight as number ) * ( scale / 100 )
	);

	return {
		scaledWidth,
		scaledHeight,
	};
}

export default function ImageSizeControl( {
	imageSizeHelp,
	imageWidth,
	imageHeight,
	imageSizeOptions = [],
	isResizable = true,
	slug,
	width,
	height,
	onChange,
	onChangeImage = noop,
}: ImageSizeControlProps ) {
	const { currentHeight, currentWidth, updateDimension, updateDimensions } =
		useDimensionHandler( height, width, imageHeight, imageWidth, onChange );

	/**
	 * Updates the dimensions for the given scale.
	 * Handler for toggle group control change.
	 *
	 * @param scale The scale to update the dimensions for.
	 */
	const handleUpdateDimensions = ( scale?: string | number ) => {
		if ( undefined === scale ) {
			updateDimensions();
			return;
		}

		const { scaledWidth, scaledHeight } = getScaledWidthAndHeight(
			// The preset values are numbers.
			scale as number,
			imageWidth,
			imageHeight
		);

		updateDimensions( scaledHeight, scaledWidth );
	};

	/**
	 * Add the stored image preset value to toggle group control.
	 */
	const selectedValue = IMAGE_SIZE_PRESETS.find( ( scale ) => {
		const { scaledWidth, scaledHeight } = getScaledWidthAndHeight(
			scale,
			imageWidth,
			imageHeight
		);

		return currentWidth === scaledWidth && currentHeight === scaledHeight;
	} );

	return (
		<VStack className="block-editor-image-size-control" spacing="4">
			{ imageSizeOptions && imageSizeOptions.length > 0 && (
				<SelectControl
					label={ __( 'Resolution' ) }
					value={
						imageSizeOptions.find(
							( item ) => item.value === slug
						) ??
						imageSizeOptions.find( ( item ) => ! item.disabled ) ??
						null
					}
					items={ imageSizeOptions }
					onValueChange={ ( item, eventDetails ) =>
						onChangeImage( item?.value ?? '', {
							event: eventDetails.event,
						} )
					}
					description={
						typeof imageSizeHelp === 'string'
							? imageSizeHelp
							: undefined
					}
					details={
						typeof imageSizeHelp !== 'string'
							? imageSizeHelp
							: undefined
					}
				/>
			) }
			{ isResizable && (
				<>
					<HStack
						// @ts-expect-error `HStack` passes `align` on to `Flex`.
						align="baseline"
						spacing="4"
					>
						<NumberControl
							label={ __( 'Width' ) }
							// A `null` size shows an empty field.
							value={
								currentWidth as number | string | undefined
							}
							min={ 1 }
							onChange={ ( value ) =>
								updateDimension( 'width', value )
							}
						/>
						<NumberControl
							label={ __( 'Height' ) }
							// A `null` size shows an empty field.
							value={
								currentHeight as number | string | undefined
							}
							min={ 1 }
							onChange={ ( value ) =>
								updateDimension( 'height', value )
							}
						/>
					</HStack>
					<ToggleGroupControl
						label={ __( 'Image size presets' ) }
						hideLabelFromVision
						onChange={ handleUpdateDimensions }
						value={ selectedValue }
						isBlock
					>
						{ IMAGE_SIZE_PRESETS.map( ( scale ) => {
							return (
								<ToggleGroupControlOption
									key={ scale }
									value={ scale }
									label={ sprintf(
										/* translators: %d: Percentage value. */
										__( '%d%%' ),
										scale
									) }
								/>
							);
						} ) }
					</ToggleGroupControl>
				</>
			) }
		</VStack>
	);
}
