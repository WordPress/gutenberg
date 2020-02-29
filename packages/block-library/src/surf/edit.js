/**
 * WordPress dependencies
 */
import { RangeControl, PanelBody } from '@wordpress/components';
import { InspectorControls } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Text from './text';

// Let's make some waves!
//
// We can add some style

const SurfEdit = ( { attributes, setAttributes } ) => {
	const { waveHeight } = attributes;

	const changeWaveHeight = ( height ) => {
		setAttributes( { waveHeight: height } );
	};

	// let's add a wave emoji that changes size
	const styles = {
		waveHeightText: { color: 'darkblue' },
		waveEmoji: { fontSize: 20 + 3 * waveHeight },
	};

	return (
		<>
			<Text style={ styles.waveEmoji }>🌊</Text>
			<Text style={ styles.waveHeightText }>
				Wave height: { waveHeight } ft
			</Text>
			<InspectorControls>
				<PanelBody title={ __( 'Surf settings' ) }>
					<RangeControl
						label={ __( 'Wave height in feet' ) }
						min={ 0 }
						max={ 25 }
						separatorType={ 'none' }
						value={ waveHeight }
						onChange={ changeWaveHeight }
					/>
				</PanelBody>
			</InspectorControls>
		</>
	);
};

export default SurfEdit;
