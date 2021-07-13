/**
 * WordPress dependencies
 */
import {
	Button,
	Card,
	CardBody,
	CardHeader,
	ColorPicker,
	__experimentalHeading as Heading,
	__experimentalHStack as HStack,
	__experimentalUseContextSystem as useContextSystem,
	__experimentalView as View,
} from '@wordpress/components';
import { close } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { useAppState } from '../state';

export function ColorPickerModal() {
	const appState = useAppState();
	const { showColorPicker, toggleShowColorPicker } = appState;
	const { colorPickerKey, get, set } = appState;
	const buttonProps = {
		onClick: toggleShowColorPicker,
		size: 'small',
	};
	const { ...otherButtonProps } = useContextSystem(
		buttonProps,
		'CloseButton'
	);
	if ( ! showColorPicker ) return null;

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
							<Button
								icon={ close }
								iconSize={ 12 }
								variant="tertiary"
								{ ...otherButtonProps }
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
