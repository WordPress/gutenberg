/**
 * WordPress dependencies
 */
import {
	Button,
	ButtonGroup,
	CardBody,
	ColorIndicator,
	__experimentalHStack as HStack,
	Panel,
	PanelHeader,
	__experimentalVStack as VStack,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { Screen, ScreenHeader } from '../components';
import { useAppState } from '../state';

const Palette = ( { colors = [], title, index } ) => {
	const appState = useAppState();

	const handleOnClick = ( i ) => () => {
		appState.setColorPickerKey(
			`color.palettes[${ index }].colors[${ i }].color`
		);
		appState.setShowColorPicker( true );
	};

	return (
		<Panel>
			<PanelHeader>{ title }</PanelHeader>
			<HStack alignment="left" wrap>
				{ colors.map( ( color, colorIndex ) => (
					<ColorIndicator
						colorValue={ color.color }
						key={ color.id }
						onClick={ handleOnClick( colorIndex ) }
						circular
					/>
				) ) }
			</HStack>
		</Panel>
	);
};

const Palettes = () => {
	const [ palettes ] = useAppState( 'color.palettes' );
	return (
		<>
			<Panel>
				<ButtonGroup defaultValue={ null }>
					<Button value="solids">Solids</Button>
					<Button value="gradients">Gradients</Button>
				</ButtonGroup>
			</Panel>
			{ palettes.map( ( palette, index ) => (
				<Palette
					key={ palette.id }
					{ ...palette }
					_key={ palette.id }
					index={ index }
				/>
			) ) }
		</>
	);
};

export const ColorsPaletteScreen = () => {
	return (
		<Screen>
			<CardBody>
				<VStack spacing={ 8 }>
					<ScreenHeader
						back="/colors"
						description={ `Manages the available colors to use across the site and its
				blocks.` }
						title="Palette"
					/>
					<Palettes />
				</VStack>
			</CardBody>
		</Screen>
	);
};
