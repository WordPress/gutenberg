/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import {
	Button,
	RangeControl,
	CustomSelectControl,
	__experimentalUnitControl as UnitControl,
	__experimentalHStack as HStack,
	__experimentalText as Text,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { settings } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { LABELS } from './utils';

export default function SpacingInputControl( {
	spacingSizes,
	value,
	side,
	onChange,
} ) {
	const [ valueNow, setValueNow ] = useState( null );
	const [ showCustomValueControl, setShowCustomValueControl ] =
		useState( false );
	const customTooltipContent = ( newValue ) => spacingSizes[ newValue ]?.name;

	const getNewCustomValue = ( newSize ) => {
		return newSize;
	};
	const getNewRangeValue = ( newSize ) => {
		setValueNow( newSize );
		const size = parseInt( newSize, 10 );
		if ( size === 0 ) {
			return '0';
		}
		return `var:preset|spacing|${ spacingSizes[ newSize ]?.slug }`;
	};

	const currentValueHint = customTooltipContent( value );

	const options = spacingSizes.map( ( size, index ) => ( {
		key: index,
		name: size.name,
	} ) );
	const marks = spacingSizes.map( ( newValue, index ) => ( {
		value: index,
		lable: undefined,
	} ) );

	return (
		<>
			<HStack>
				<Text>{ LABELS[ side ] }</Text>

				{ spacingSizes.length <= 8 && ! showCustomValueControl && (
					<Text className="components-spacing-sizes-control__hint">
						{ currentValueHint !== undefined
							? currentValueHint
							: __( 'Default' ) }
					</Text>
				) }

				{ spacingSizes.length > 8 && ! showCustomValueControl && (
					<CustomSelectControl
						value={ options.find(
							( option ) => option.key === valueNow
						) }
						onChange={ ( selectedItem ) => {
							onChange( getNewRangeValue( selectedItem.key ) );
						} }
						options={ options }
						onHighlightedIndexChange={ ( index ) => {
							if ( index.type === '__item_mouse_move__' ) {
								onChange(
									getNewRangeValue( index.highlightedIndex )
								);
							}
						} }
					/>
				) }
				<Button
					label={
						showCustomValueControl
							? __( 'Use size preset' )
							: __( 'Set custom size' )
					}
					icon={ settings }
					onClick={ () => {
						setShowCustomValueControl( ! showCustomValueControl );
					} }
					isPressed={ showCustomValueControl }
					isSmall
					className="components-spacing-sizes-control__custom-toggle"
				/>
			</HStack>
			{ showCustomValueControl && (
				<HStack className="components-spacing-sizes-control__custom-value-control">
					<UnitControl
						onChange={ ( newSize ) =>
							onChange( getNewCustomValue( newSize ) )
						}
						value="28%"
					/>

					<RangeControl
						value={ value }
						min={ 0 }
						max={ 50 }
						withInputField={ false }
					/>
				</HStack>
			) }
			{ spacingSizes.length <= 8 && ! showCustomValueControl && (
				<RangeControl
					value={ value }
					onChange={ ( newSize ) =>
						onChange( getNewRangeValue( newSize ) )
					}
					withInputField={ false }
					aria-valuenow={ valueNow }
					aria-valuetext={ spacingSizes[ valueNow ]?.name }
					renderTooltipContent={ customTooltipContent }
					min={ 0 }
					max={ spacingSizes.length - 1 }
					marks={ marks }
				/>
			) }
		</>
	);
}
