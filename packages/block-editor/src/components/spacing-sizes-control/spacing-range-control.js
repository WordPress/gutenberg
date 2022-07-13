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
export default function SpacingRangeControl( props ) {
	const [ valueNow, setValueNow ] = useState( null );
	const [ showCustomValueControl, setShowCustomValueControl ] =
		useState( false );
	const customTooltipContent = ( value ) => props.spacingSizes[ value ]?.name;
	const createHandleOnFocus = ( side ) => () => {
		props.onFocus( side );
	};
	const useSelect = props.useSelect;
	const getNewCustomValue = ( newSize ) => {
		return newSize;
	};
	const getNewRangeValue = ( newSize ) => {
		setValueNow( newSize );
		const size = parseInt( newSize, 10 );
		if ( size === 0 ) {
			return undefined;
		}
		if ( size === 1 ) {
			return '0';
		}
		return `var:preset|spacing|${ props.spacingSizes[ newSize ]?.slug }`;
	};

	const currentValueHint = customTooltipContent( props.value );

	const options = props.spacingSizes.map( ( size, index ) => ( {
		key: index,
		name: size.name,
	} ) );
	return (
		<>
			{ /* <Button
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
			/> */ }
			{ showCustomValueControl && (
				<UnitControl
					label={ props.label }
					onChange={ ( newSize ) =>
						props.onChange( getNewCustomValue( newSize ) )
					}
					value="28%"
				/>
			) }
			{ ! useSelect && ! showCustomValueControl && (
				<RangeControl
					value={ props.value }
					label={
						<>
							<span>{ props.label }</span>{ ' ' }
							<span className="components-spacing-sizes-control__hint">
								{ currentValueHint !== undefined
									? currentValueHint
									: __( 'Default' ) }
							</span>
						</>
					}
					onChange={ ( newSize ) =>
						props.onChange( getNewRangeValue( newSize ) )
					}
					onFocus={ createHandleOnFocus( props.side ) }
					withInputField={ false }
					aria-valuenow={ valueNow }
					aria-valuetext={ props.spacingSizes[ valueNow ]?.name }
					renderTooltipContent={ customTooltipContent }
					min={ 0 }
					max={ props.spacingSizes.length - 1 }
				/>
			) }
			{ useSelect && ! showCustomValueControl && (
				<CustomSelectControl
					value={ options.find(
						( option ) => option.key === valueNow
					) }
					label={ props.label }
					onChange={ ( selectedItem ) => {
						props.onChange( getNewRangeValue( selectedItem.key ) );
					} }
					onFocus={ createHandleOnFocus( props.side ) }
					options={ options }
					onHighlightedIndexChange={ ( index ) => {
						if ( index.type === '__item_mouse_move__' ) {
							props.onChange(
								getNewRangeValue( index.highlightedIndex )
							);
						}
					} }
				/>
			) }
		</>
	);
}
