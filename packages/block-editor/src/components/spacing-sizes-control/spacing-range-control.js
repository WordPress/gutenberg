/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { RangeControl, SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Inspector control panel containing the spacing size related configuration
 *
 * @param {Object} props
 *
 * @return {WPElement} Font size edit element.
 */
export default function SpacingRangeControl( props ) {
	const [ valueNow, setValueNow ] = useState( null );
	const customTooltipContent = ( value ) => props.spacingSizes[ value ]?.name;
	const createHandleOnFocus = ( side ) => () => {
		props.onFocus( side );
	};
	//console.log( props.value );
	const getNewSizeValue = ( newSize ) => {
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

	return (
		<>
			{ /* <UnitControl label={ props.label } /> */ }
			{ /* <RangeControl
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
					props.onChange( getNewSizeValue( newSize ) )
				}
				onFocus={ createHandleOnFocus( props.side ) }
				withInputField={ false }
				aria-valuenow={ valueNow }
				aria-valuetext={ props.spacingSizes[ valueNow ]?.name }
				renderTooltipContent={ customTooltipContent }
				min={ 0 }
				max={ props.spacingSizes.length - 1 }
			/> */ }
			<SelectControl
				value={ props.value }
				label={ props.label }
				onChange={ ( newSize ) =>
					props.onChange( getNewSizeValue( newSize ) )
				}
				onFocus={ createHandleOnFocus( props.side ) }
				options={ props.spacingSizes.map( ( size, index ) => ( {
					value: index,
					label: size.name,
				} ) ) }
			/>
		</>
	);
}
