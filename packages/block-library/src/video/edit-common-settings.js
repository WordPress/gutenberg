/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ToggleControl, SelectControl } from '@wordpress/components';
import { useMemo, useCallback } from '@wordpress/element';

const options = [
	{ value: 'auto', label: __( 'Auto' ) },
	{ value: 'metadata', label: __( 'Metadata' ) },
	{ value: 'none', label: __( 'None' ) },
];

const VideoSettings = ( { setAttributes, attributes } ) => {
	const {
		autoplay,
		controls,
		loop,
		muted,
		playsInline,
		preload,
	} = attributes;

	const getAutoplayHelp = useCallback( ( checked ) => {
		return checked
			? __(
					'Note: Autoplaying videos may cause usability issues for some visitors.'
			  )
			: null;
	}, [] );

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
			<ToggleControl
				label={ __( 'Autoplay' ) }
				onChange={ toggleFactory.autoplay }
				checked={ autoplay }
				help={ getAutoplayHelp }
			/>
			<ToggleControl
				label={ __( 'Loop' ) }
				onChange={ toggleFactory.loop }
				checked={ loop }
			/>
			<ToggleControl
				label={ __( 'Muted' ) }
				onChange={ toggleFactory.muted }
				checked={ muted }
			/>
			<ToggleControl
				label={ __( 'Playback controls' ) }
				onChange={ toggleFactory.controls }
				checked={ controls }
			/>
			<ToggleControl
				label={ __( 'Play inline' ) }
				onChange={ toggleFactory.playsInline }
				checked={ playsInline }
			/>
			<SelectControl
				label={ __( 'Preload' ) }
				value={ preload }
				onChange={ onChangePreload }
				options={ options }
			/>
		</>
	);
};

export default VideoSettings;
