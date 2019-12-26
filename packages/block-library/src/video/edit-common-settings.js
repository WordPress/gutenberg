/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	ToggleControl,
	SelectControl,
} from '@wordpress/components';

const VideoSettings = ( { setAttributes, attributes } ) => {
	const {
		autoplay,
		controls,
		loop,
		muted,
		playsInline,
		preload,
	} = attributes;

	const getAutoplayHelp = ( checked ) => {
		return checked ? __( 'Note: Autoplaying videos may cause usability issues for some visitors.' ) : null;
	};

	const toggleAttribute = ( attribute ) => {
		return ( newValue ) => {
			setAttributes( { [ attribute ]: newValue } );
		};
	};

	return (
		<>
			<ToggleControl
				label={ __( 'Autoplay' ) }
				onChange={ toggleAttribute( 'autoplay' ) }
				checked={ autoplay }
				help={ getAutoplayHelp }
			/>
			<ToggleControl
				label={ __( 'Loop' ) }
				onChange={ toggleAttribute( 'loop' ) }
				checked={ loop }
			/>
			<ToggleControl
				label={ __( 'Muted' ) }
				onChange={ toggleAttribute( 'muted' ) }
				checked={ muted }
			/>
			<ToggleControl
				label={ __( 'Playback Controls' ) }
				onChange={ toggleAttribute( 'controls' ) }
				checked={ controls }
			/>
			<ToggleControl
				label={ __( 'Play inline' ) }
				onChange={ toggleAttribute( 'playsInline' ) }
				checked={ playsInline }
			/>
			<SelectControl
				label={ __( 'Preload' ) }
				value={ preload }
				onChange={ ( value ) => setAttributes( { preload: value } ) }
				options={ [
					{ value: 'auto', label: __( 'Auto' ) },
					{ value: 'metadata', label: __( 'Metadata' ) },
					{ value: 'none', label: __( 'None' ) },
				] }
			/>
		</>
	);
};

export default VideoSettings;
