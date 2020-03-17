/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { TextControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import {
	BASE_DEFAULT_VALUE,
	RESET_VALUE,
	STEP,
	useIsLineHeightControlsDisabled,
	useLineHeightControlState,
	isLineHeightDefined,
} from './utils';

export default function LineHeightControl( {
	className,
	style = {},
	...props
} ) {
	const [ lineHeight, setLineHeight ] = useLineHeightControlState();
	const isDisabled = useIsLineHeightControlsDisabled();
	const isDefined = isLineHeightDefined( lineHeight );

	// Don't render the controls if disabled by editor settings
	if ( isDisabled ) {
		return null;
	}

	const handleOnChange = ( nextValue ) => {
		// Set the next value without modification if lineHeight has been defined
		if ( isDefined ) {
			setLineHeight( nextValue );
			return;
		}

		// Otherwise...
		let adjustedNextValue = nextValue;

		switch ( nextValue ) {
			case `${ STEP }`:
				// Increment by step value
				adjustedNextValue = BASE_DEFAULT_VALUE + STEP;
				break;
			case '0':
				// Decrement by step value
				adjustedNextValue = BASE_DEFAULT_VALUE - STEP;
				break;
		}

		setLineHeight( adjustedNextValue );
	};

	const classes = classnames( 'block-editor-line-height-control', className );

	const value = isDefined ? lineHeight : RESET_VALUE;

	return (
		<div className={ classes } style={ style }>
			<TextControl
				autoComplete="off"
				onChange={ handleOnChange }
				label={ __( 'Line height' ) }
				placeholder={ BASE_DEFAULT_VALUE }
				step={ STEP }
				type="number"
				value={ value }
				{ ...props }
				min={ 0 }
			/>
		</div>
	);
}
