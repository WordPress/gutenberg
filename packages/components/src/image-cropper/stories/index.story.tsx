/**
 * External dependencies
 */
import type { Meta, StoryObj, StoryFn } from '@storybook/react';
/**
 * WordPress dependencies
 */
import { useState, useContext } from '@wordpress/element';
import { aspectRatio } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { ImageCropper, ImageCropperContext } from '../';
import { Button, RangeControl, Flex, FlexItem, DropdownMenu } from '../../';

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

function StateLogger() {
	const { state } = useContext( ImageCropperContext );
	return <pre>{ JSON.stringify( state, null, 2 ) }</pre>;
}

function TemplateControls() {
	const { state, dispatch, getImageBlob } = useContext( ImageCropperContext );
	const [ previewUrl, setPreviewUrl ] = useState< string >( '' );

	return (
		<>
			<Flex justify="flex-start">
				<FlexItem>
					<ImageCropper />
				</FlexItem>

				{ previewUrl && (
					<FlexItem>
						<a href={ previewUrl } target="_blank" rel="noreferrer">
							<img
								src={ previewUrl }
								alt="preview"
								width={ state.cropper.width }
								height={ state.cropper.height }
							/>
						</a>
					</FlexItem>
				) }
			</Flex>
			<Flex wrap justify="flex-start">
				<FlexItem style={ { width: 200 } }>
					<RangeControl
						label="angle"
						min={ -45 }
						max={ 45 }
						step={ 1 }
						value={ state.tilt }
						onChange={ ( value ) => {
							dispatch( {
								type: 'SET_TILT',
								tilt: Number( value ),
							} );
						} }
					/>
				</FlexItem>

				<Button
					variant="secondary"
					onClick={ () => {
						dispatch( {
							type: 'ROTATE_90_DEG',
							isCounterClockwise: true,
						} );
					} }
				>
					Rotate -90°
				</Button>
				<Button
					variant="secondary"
					onClick={ () => {
						dispatch( { type: 'ROTATE_90_DEG' } );
					} }
				>
					Rotate 90°
				</Button>
				<Button
					variant="secondary"
					onClick={ () => {
						dispatch( { type: 'FLIP' } );
					} }
				>
					Flip horizontally
				</Button>
				<DropdownMenu
					label="Aspect ratio"
					text="Aspect ratio"
					icon={ null }
					toggleProps={ { variant: 'secondary' } }
					controls={ [
						{ value: 0, title: 'Free' },
						{
							value: state.image.width / state.image.height,
							title: 'Original',
						},
						{ value: 1, title: 'Square' },
						{ value: 4 / 3, title: '4:3' },
						{ value: 16 / 9, title: '16:9' },
						{ value: 9 / 16, title: '9:16' },
						{ value: 3 / 4, title: '3:4' },
					].map( ( control ) => ( {
						title: control.title,
						role: 'menuitemradio',
						icon: aspectRatio,
						isActive: state.isAspectRatioLocked
							? state.cropper.width / state.cropper.height ===
							  control.value
							: 0 === control.value,
						onClick: () => {
							if ( control.value === 0 ) {
								dispatch( {
									type: 'UNLOCK_ASPECT_RATIO',
								} );
							} else {
								dispatch( {
									type: 'LOCK_ASPECT_RATIO',
									aspectRatio: control.value,
								} );
							}
						},
					} ) ) }
				/>
			</Flex>
			<Flex justify="flex-start">
				<Button
					variant="primary"
					onClick={ async () => {
						const blob = await getImageBlob( state );
						if ( previewUrl ) {
							URL.revokeObjectURL( previewUrl );
						}
						setPreviewUrl( URL.createObjectURL( blob ) );
					} }
				>
					Apply
				</Button>
				<Button
					variant="secondary"
					onClick={ () => {
						dispatch( { type: 'RESET' } );
						setPreviewUrl( '' );
						URL.revokeObjectURL( previewUrl );
					} }
				>
					Reset
				</Button>
			</Flex>
		</>
	);
}

const Template: StoryFn< typeof ImageCropper.Provider > = ( { ...args } ) => {
	return (
		<ImageCropper.Provider { ...args }>
			<TemplateControls />
			<StateLogger />
		</ImageCropper.Provider>
	);
};

export const Default: StoryObj< typeof ImageCropper.Provider > = Template.bind(
	{}
);
Default.args = {
	src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Hydrochoeris_hydrochaeris_in_Brazil_in_Petr%C3%B3polis%2C_Rio_de_Janeiro%2C_Brazil_09.jpg/1200px-Hydrochoeris_hydrochaeris_in_Brazil_in_Petr%C3%B3polis%2C_Rio_de_Janeiro%2C_Brazil_09.jpg',
	width: 300,
	height: 200,
};
