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

	// we can use a style object to pass inline styles
	const style = {
		color: 'darkblue',
	};

	return (
		<>
			<Text style={ style }>Wave height: { waveHeight } ft</Text>
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
