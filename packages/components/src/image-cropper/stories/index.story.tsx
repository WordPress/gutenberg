/**
 * External dependencies
 */
import type { Meta, StoryObj, StoryFn } from '@storybook/react';
/**
 * WordPress dependencies
 */
import { useState, useContext } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { ImageCropper, ImageCropperContext } from '../';

const meta: Meta< typeof ImageCropper.Provider > = {
	component: ImageCropper.Provider,
	title: 'Components/ImageCropper',
	argTypes: {
		src: { control: { type: 'text' } },
		width: { control: { type: 'number' } },
		height: { control: { type: 'number' } },
	},
	parameters: {
		controls: { expanded: true },
	},
};
export default meta;

function TemplateControls() {
	const { state, dispatch, getImageBlob } = useContext( ImageCropperContext );
	const [ previewUrl, setPreviewUrl ] = useState< string >( '' );

	return (
		<>
			<input
				type="range"
				min={ -45 }
				max={ 45 }
				step={ 1 }
				value={ state.angle }
				onChange={ ( event ) => {
					dispatch( {
						type: 'ROTATE',
						angle: Number( event.target.value ),
					} );
				} }
			/>

			<button
				onClick={ () => {
					dispatch( {
						type: 'ROTATE_CLOCKWISE',
						isCounterClockwise: true,
					} );
				} }
			>
				Rotate -90°
			</button>
			<button
				onClick={ () => {
					dispatch( { type: 'ROTATE_CLOCKWISE' } );
				} }
			>
				Rotate 90°
			</button>
			<button
				onClick={ async () => {
					const blob = await getImageBlob( state );
					if ( previewUrl ) {
						URL.revokeObjectURL( previewUrl );
					}
					setPreviewUrl( URL.createObjectURL( blob ) );
				} }
			>
				Apply
			</button>
			<button
				onClick={ () => {
					dispatch( { type: 'RESET' } );
					setPreviewUrl( '' );
					URL.revokeObjectURL( previewUrl );
				} }
			>
				Reset
			</button>
			{ previewUrl && (
				<div>
					<img src={ previewUrl } alt="preview" />
				</div>
			) }
		</>
	);
}

const Template: StoryFn< typeof ImageCropper.Provider > = ( { ...args } ) => {
	return (
		<ImageCropper.Provider { ...args }>
			<ImageCropper />

			<TemplateControls />
		</ImageCropper.Provider>
	);
};

export const Default: StoryObj< typeof ImageCropper.Provider > = Template.bind(
	{}
);
Default.args = {
	src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Hydrochoeris_hydrochaeris_in_Brazil_in_Petr%C3%B3polis%2C_Rio_de_Janeiro%2C_Brazil_09.jpg/1200px-Hydrochoeris_hydrochaeris_in_Brazil_in_Petr%C3%B3polis%2C_Rio_de_Janeiro%2C_Brazil_09.jpg',
	width: 250,
	height: 200,
};
