/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';
import {
	InspectorControls,
	useBlockProps,
	__experimentalColorGradientSettingsDropdown as ColorGradientSettingsDropdown,
	__experimentalUseMultipleOriginColorsAndGradients as useMultipleOriginColorsAndGradients,
} from '@wordpress/block-editor';
import { Disabled } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { PlaylistContext } from '../playlist/context';
import { WaveformPlayer } from '../utils/waveform-player';

export default function PlaylistPlayerEdit( {
	attributes,
	clientId,
	isSelected,
	setAttributes,
} ) {
	const { waveformColor } = attributes;
	const { currentTrackData, onTrackEnded, showImages, waveformStyle } =
		useContext( PlaylistContext );
	const colorGradientSettings = useMultipleOriginColorsAndGradients();

	const blockProps = useBlockProps( {
		className: 'wp-block-playlist__waveform-player',
		style: waveformColor
			? { '--wp--playlist-player--waveform-color': waveformColor }
			: undefined,
	} );

	return (
		<>
			{ colorGradientSettings.hasColorsOrGradients && (
				<InspectorControls group="color">
					<ColorGradientSettingsDropdown
						__experimentalIsRenderedInSidebar
						settings={ [
							{
								colorValue: waveformColor,
								label: __( 'Waveform' ),
								onColorChange: ( colorValue ) =>
									setAttributes( {
										waveformColor: colorValue,
									} ),
								resetAllFilter: () =>
									setAttributes( {
										waveformColor: undefined,
									} ),
								isShownByDefault: true,
								enableAlpha: true,
								clearable: true,
							},
						] }
						panelId={ clientId }
						{ ...colorGradientSettings }
					/>
				</InspectorControls>
			) }
			<div { ...blockProps }>
				<Disabled isDisabled={ ! isSelected }>
					<WaveformPlayer
						src={ currentTrackData?.src }
						title={ currentTrackData?.title }
						artist={ currentTrackData?.artist }
						image={
							showImages !== false
								? currentTrackData?.image
								: undefined
						}
						imageAlt={
							showImages !== false
								? currentTrackData?.imageAlt
								: undefined
						}
						waveformStyle={ waveformStyle }
						onEnded={ onTrackEnded }
					/>
				</Disabled>
			</div>
		</>
	);
}
