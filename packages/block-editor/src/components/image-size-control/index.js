/**
 * WordPress dependencies
 */
import {
	Button,
	ButtonGroup,
	SelectControl,
	__experimentalNumberControl as NumberControl,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const IMAGE_SIZE_PRESETS = [ 25, 50, 75, 100 ];
const noop = () => {};

export default function ImageSizeControl( {
	imageSizeHelp,
	width,
	height,
	naturalWidth,
	naturalHeight,
	imageSizeOptions = [],
	isResizable = true,
	slug,
	onChange,
	onChangeImage = noop,
} ) {
	return (
		<>
			{ imageSizeOptions && imageSizeOptions.length > 0 && (
				<SelectControl
					__nextHasNoMarginBottom
					label={ __( 'Resolution' ) }
					value={ slug }
					options={ imageSizeOptions }
					onChange={ onChangeImage }
					help={ imageSizeHelp }
					size="__unstable-large"
				/>
			) }
			{ isResizable && (
				<div className="block-editor-image-size-control">
					<HStack align="baseline" spacing="3">
						<NumberControl
							className="block-editor-image-size-control__width"
							label={ __( 'Width' ) }
							placeholder={ __( 'Auto' ) }
							value={ width }
							min={ 1 }
							onChange={ ( nextWidth ) =>
								onChange( {
									height,
									width: Number( nextWidth ),
								} )
							}
							size="__unstable-large"
						/>
						<NumberControl
							className="block-editor-image-size-control__height"
							label={ __( 'Height' ) }
							placeholder={ __( 'Auto' ) }
							value={ height }
							min={ 1 }
							onChange={ ( nextHeight ) =>
								onChange( {
									height: Number( nextHeight ),
									width,
								} )
							}
							size="__unstable-large"
						/>
					</HStack>
					<HStack>
						<ButtonGroup aria-label={ __( 'Image size presets' ) }>
							{ IMAGE_SIZE_PRESETS.map( ( scale ) => {
								const scaledWidth = Math.round(
									naturalWidth * ( scale / 100 )
								);
								const scaledHeight = Math.round(
									naturalHeight * ( scale / 100 )
								);

								const isCurrent =
									width === scaledWidth &&
									height === scaledHeight;

								return (
									<Button
										key={ scale }
										isSmall
										variant={
											isCurrent ? 'primary' : undefined
										}
										isPressed={ isCurrent }
										onClick={ () =>
											onChange( {
												width: scaledWidth,
												height: scaledHeight,
											} )
										}
									>
										{ scale }%
									</Button>
								);
							} ) }
						</ButtonGroup>
						<Button
							isSmall
							onClick={ () =>
								onChange( {
									width: undefined,
									height: undefined,
								} )
							}
						>
							{ __( 'Reset' ) }
						</Button>
					</HStack>
				</div>
			) }
		</>
	);
}
