/**
 * External dependencies
 */
import colorize from 'tinycolor2';
import classnames from 'classnames';
import { noop } from 'lodash';
/**
 * WordPress dependencies
 */
import { useState, useCallback } from '@wordpress/element';
import { compose, withInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BaseControl from '../base-control';
import ColorPicker from '../color-picker';
import Dropdown from '../dropdown';

import {
	ControlContainer,
	ControlWrapper,
	ColorSwatch,
	ColorLabel,
} from './styles/color-control-styles';

function BaseColorControl( {
	className,
	instanceId,
	label,
	value = 'black',
	onChange = noop,
	...props
} ) {
	const [ isFocused, setIsFocused ] = useState( false );
	const [ isOpen, setIsOpen ] = useState( false );

	// TODO: Add derived prop/controlled hook to manage state
	const [ color, setColor ] = useState( toColor( value ) );

	const handleOnChange = ( nextColor ) => {
		setColor( nextColor );
		onChange( nextColor );
	};

	const renderToggle = useCallback(
		( { isOpen: isOpenProp, onToggle } ) => {
			setIsOpen( isOpenProp );
			return (
				<ColorSwatch
					aria-expanded={ isOpenProp }
					onBlur={ () => setIsFocused( false ) }
					onFocus={ () => setIsFocused( true ) }
					style={ { backgroundColor: color } }
					onClick={ onToggle }
				/>
			);
		},
		[ color ]
	);

	const renderContent = useCallback(
		() => (
			<ColorPicker
				color={ color }
				onChangeComplete={ ( nextColor ) =>
					handleOnChange( nextColor.hex )
				}
				disableAlpha
			/>
		),
		[ color ]
	);

	const classes = classnames( 'components-color-control', className );
	const id = `inspector-color-control-${ instanceId }`;
	const isFocusedOrOpen = isFocused || isOpen;

	return (
		<ControlWrapper className={ classes }>
			<BaseControl label={ label } id={ id } { ...props }>
				<ControlContainer
					isFocused={ isFocusedOrOpen }
					className="components-color-control__container"
				>
					<Dropdown
						className="components-color-control__swatch-picker"
						noArrow={ true }
						position="middle left"
						renderToggle={ renderToggle }
						renderContent={ renderContent }
					/>
					<ColorLabel className="components-color-control__label">
						{ color }
					</ColorLabel>
				</ControlContainer>
			</BaseControl>
		</ControlWrapper>
	);
}

function toColor( color ) {
	return colorize( color ).toHexString();
}

export default compose( [ withInstanceId ] )( BaseColorControl );
