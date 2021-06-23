/**
 * WordPress dependencies
 */
import {
	Card,
	CardBody,
	CardHeader,
	CloseButton,
	ColorPicker,
	Heading,
	HStack,
	View,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { useAppState } from '../state';

export function ColorPickerModal() {
	const appState = useAppState();
	const { showColorPicker, toggleShowColorPicker } = appState;
	if ( ! showColorPicker ) return null;
	const { colorPickerKey, get, set } = appState;

	const color = get( colorPickerKey );
	const handleOnChange = ( next ) => set( colorPickerKey, next );

	return (
		<View
			css={ {
				position: 'fixed',
				right: 280,
				top: 0,
				bottom: 0,
				zIndex: 999,
			} }
		>
			<View css={ { right: 12, top: 100, position: 'relative' } }>
				<Card>
					<CardHeader>
						<HStack>
							<Heading size={ 5 }>Color</Heading>
							<CloseButton
								onClick={ toggleShowColorPicker }
								size="small"
							/>
						</HStack>
					</CardHeader>
					<CardBody>
						<ColorPicker
							color={ color }
							onChange={ handleOnChange }
							width={ 280 }
						/>
					</CardBody>
				</Card>
			</View>
		</View>
	);
}
