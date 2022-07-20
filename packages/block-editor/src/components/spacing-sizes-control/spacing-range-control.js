/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import {
	Button,
	RangeControl,
	CustomSelectControl,
	__experimentalUnitControl as UnitControl,
	__experimentalParseQuantityAndUnitFromRawValue as parseQuantityAndUnitFromRawValue,
	__experimentalBoxControlIcon as BoxControlIcon,
	__experimentalHStack as HStack,
	__experimentalText as Text,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { settings } from '@wordpress/icons';

/**
 * Inspector control panel containing the spacing size related configuration
 *
 * @param {Object} props
 *
 * @return {WPElement} Font size edit element.
 */
export default function SpacingRangeControl( {
	spacingSizes,
	value,
	side,
	label,
	onChange,
} ) {
	const [ valueNow, setValueNow ] = useState( null );
	const [ showCustomValueControl, setShowCustomValueControl ] =
		useState( false );
	const customTooltipContent = ( newValue ) => spacingSizes[ newValue ]?.name;
	const useSelect = false; //props.useSelect;
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
				<BoxControlIcon
					side={ side }
					sides={ [
						'top',
						'right',
						'bottom',
						'left',
						'vertical',
						'horizontal',
					] }
				/>

				{ spacingSizes.length <= 8 && (
					<Text className="components-spacing-sizes-control__hint">
						{ currentValueHint !== undefined
							? currentValueHint
							: __( 'Default' ) }
					</Text>
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
				<div>
					<UnitControl
						label={ label }
						onChange={ ( newSize ) =>
							onChange( getNewCustomValue( newSize ) )
						}
						value="28%"
					/>

					<RangeControl
						value={ value }
						label={ <></> }
						min={ 0 }
						max={ 50 }
						// initialPosition={ 0 }
						withInputField={ false }
						onChange={ ( newValue ) => console.log( newValue ) }
						// step={ step }
					/>
				</div>
			) }
			{ spacingSizes.length <= 8 && ! showCustomValueControl && (
				<RangeControl
					value={ value }
					label={ <></> }
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
			{ spacingSizes.length > 8 && ! showCustomValueControl && (
				<CustomSelectControl
					value={ options.find(
						( option ) => option.key === valueNow
					) }
					label={ <></> }
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
		</>
	);
}
