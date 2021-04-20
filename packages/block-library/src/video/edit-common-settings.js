/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ToggleControl, SelectControl } from '@wordpress/components';
import { useMemo, useCallback, Platform } from '@wordpress/element';

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
				hideCancelButton={ true }
			/>
		</>
	);
};

export default VideoSettings;
