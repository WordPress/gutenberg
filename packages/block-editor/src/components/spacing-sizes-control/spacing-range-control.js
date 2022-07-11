/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import {
	RangeControl,
	__experimentalUnitControl as UnitControl,
} from '@wordpress/components';
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
	const reset = () => {
		props.onChange( undefined );
	};
	const currentValueHint = customTooltipContent( props.value );
	return (
		<>
			{ /* <UnitControl label={ props.label } /> */ }
			<RangeControl
				value={ props.value }
				label={
					<>
						<span>{ props.label }</span>{ ' ' }
						<span className="components-spacing-sizes-control__hint">
							{ currentValueHint !== undefined
								? currentValueHint
								: __( 'Default' ) }
						</span>{ ' ' }
						{ currentValueHint === undefined && (
							<span onClick={ reset }> [-] </span>
						) }
					</>
				}
				onChange={ ( newSize ) => {
					setValueNow( newSize );
					const size =
						newSize !== 0
							? `var:preset|spacing|${ props.spacingSizes[ newSize ]?.slug }`
							: '0';
					props.onChange( size );
				} }
				onFocus={ createHandleOnFocus( props.side ) }
				withInputField={ false }
				aria-valuenow={ valueNow }
				aria-valuetext={ props.spacingSizes[ valueNow ]?.name }
				renderTooltipContent={ customTooltipContent }
				min={ 0 }
				max={ props.spacingSizes.length - 1 }
			/>
		</>
	);
}
