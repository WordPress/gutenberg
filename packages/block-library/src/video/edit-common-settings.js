/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import {
	ToggleControl,
	SelectControl,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { useMemo, useCallback, Platform } from '@wordpress/element';

const options = [
	{ value: 'auto', label: __( 'Auto' ) },
	{ value: 'metadata', label: __( 'Metadata' ) },
	{ value: 'none', label: _x( 'None', 'Preload value' ) },
];

const VideoSettings = ( { setAttributes, attributes } ) => {
	const { autoplay, controls, loop, muted, playsInline, preload } =
		attributes;

	const autoPlayHelpText = __(
		'Autoplay may cause usability issues for some users.'
	);
	const getAutoplayHelp = Platform.select( {
		web: useCallback( ( checked ) => {
			return checked ? autoPlayHelpText : null;
		}, [] ),
		native: autoPlayHelpText,
	} );

	const toggleFactory = useMemo( () => {
		const toggleAttribute = ( attribute ) => {
			return ( newValue ) => {
				setAttributes( { [ attribute ]: newValue } );
			};
		};

		return {
			autoplay: toggleAttribute( 'autoplay' ),
			loop: toggleAttribute( 'loop' ),
			muted: toggleAttribute( 'muted' ),
			controls: toggleAttribute( 'controls' ),
			playsInline: toggleAttribute( 'playsInline' ),
		};
	}, [] );

	const onChangePreload = useCallback( ( value ) => {
		setAttributes( { preload: value } );
	}, [] );

	return (
		<>
			<ToolsPanelItem
				label={ __( 'Autoplay' ) }
				isShownByDefault
				hasValue={ () => !! autoplay }
				onDeselect={ () => {
					setAttributes( { autoplay: false } );
				} }
			>
				<ToggleControl
					__nextHasNoMarginBottom
					label={ __( 'Autoplay' ) }
					onChange={ toggleFactory.autoplay }
					checked={ !! autoplay }
					help={ getAutoplayHelp }
				/>
			</ToolsPanelItem>
			<ToolsPanelItem
				label={ __( 'Loop' ) }
				isShownByDefault
				hasValue={ () => !! loop }
				onDeselect={ () => {
					setAttributes( { loop: false } );
				} }
			>
				<ToggleControl
					__nextHasNoMarginBottom
					label={ __( 'Loop' ) }
					onChange={ toggleFactory.loop }
					checked={ !! loop }
				/>
			</ToolsPanelItem>
			<ToolsPanelItem
				label={ __( 'Muted' ) }
				isShownByDefault
				hasValue={ () => !! muted }
				onDeselect={ () => {
					setAttributes( { muted: false } );
				} }
			>
				<ToggleControl
					__nextHasNoMarginBottom
					label={ __( 'Muted' ) }
					onChange={ toggleFactory.muted }
					checked={ !! muted }
				/>
			</ToolsPanelItem>
			<ToolsPanelItem
				label={ __( 'Playback controls' ) }
				isShownByDefault
				hasValue={ () => ! controls }
				onDeselect={ () => {
					setAttributes( { controls: true } );
				} }
			>
				<ToggleControl
					__nextHasNoMarginBottom
					label={ __( 'Playback controls' ) }
					onChange={ toggleFactory.controls }
					checked={ !! controls }
				/>
			</ToolsPanelItem>
			<ToolsPanelItem
				label={ __( 'Play inline' ) }
				isShownByDefault
				hasValue={ () => !! playsInline }
				onDeselect={ () => {
					setAttributes( { playsInline: false } );
				} }
			>
				<ToggleControl
					__nextHasNoMarginBottom
					/* translators: Setting to play videos within the webpage on mobile browsers rather than opening in a fullscreen player. */
					label={ __( 'Play inline' ) }
					onChange={ toggleFactory.playsInline }
					checked={ playsInline }
					help={ __(
						'When enabled, videos will play directly within the webpage on mobile browsers, instead of opening in a fullscreen player.'
					) }
				/>
			</ToolsPanelItem>
			<ToolsPanelItem
				label={ __( 'Preload' ) }
				isShownByDefault
				hasValue={ () => preload !== 'metadata' }
				onDeselect={ () => {
					setAttributes( { preload: 'metadata' } );
				} }
			>
				<SelectControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					label={ __( 'Preload' ) }
					value={ preload }
					onChange={ onChangePreload }
					options={ options }
					hideCancelButton
				/>
			</ToolsPanelItem>
		</>
	);
};

export default VideoSettings;
