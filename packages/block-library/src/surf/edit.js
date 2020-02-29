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
// We can use some components to make our attribute adjustable

const SurfEdit = ( { attributes, setAttributes } ) => {
	const { waveHeight } = attributes;

	return (
		<>
			<Text>Wave height: { waveHeight } ft</Text>
			<InspectorControls>
				<PanelBody title={ __( 'Surf settings' ) }>
					<RangeControl
						label={ __( 'Wave height in feet' ) }
						min={ 0 }
						max={ 25 }
						separatorType={ 'none' }
						value={ waveHeight }
						// we pass a function here to listen for changes
						onChange={ () => undefined }
					/>
				</PanelBody>
			</InspectorControls>
		</>
	);
};

export default SurfEdit;
