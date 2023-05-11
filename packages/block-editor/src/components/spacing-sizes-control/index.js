/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { BaseControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import AllInputControl from './all-input-control';
import InputControls from './input-controls';
import AxialInputControls from './axial-input-controls';
import LinkedButton from './linked-button';
import { DEFAULT_VALUES, isValuesMixed, isValuesDefined } from './utils';
import useSpacingSizes from './hooks/use-spacing-sizes';

export default function SpacingSizesControl( {
	inputProps,
	onChange,
	label = __( 'Spacing Control' ),
	values,
	sides,
	splitOnAxis = false,
	useSelect,
	minimumCustomValue = 0,
	onMouseOver,
	onMouseOut,
} ) {
	const spacingSizes = useSpacingSizes();

	const inputValues = values || DEFAULT_VALUES;
	const hasInitialValue = isValuesDefined( values );
	const hasOneSide = sides?.length === 1;

	const [ isLinked, setIsLinked ] = useState(
		! hasInitialValue || ! isValuesMixed( inputValues, sides ) || hasOneSide
	);

	const toggleLinked = () => {
		setIsLinked( ! isLinked );
	};

	const handleOnChange = ( nextValue ) => {
		const newValues = { ...values, ...nextValue };
		onChange( newValues );
	};

	const inputControlProps = {
		...inputProps,
		onChange: handleOnChange,
		isLinked,
		sides,
		values: inputValues,
		spacingSizes,
		useSelect,
		type: label,
		minimumCustomValue,
		onMouseOver,
		onMouseOut,
	};

	return (
		<fieldset
			className={ classnames( 'component-spacing-sizes-control', {
				'is-unlinked': ! isLinked,
			} ) }
		>
			<BaseControl.VisualLabel as="legend">
				{ label }
			</BaseControl.VisualLabel>
			{ ! hasOneSide && (
				<LinkedButton onClick={ toggleLinked } isLinked={ isLinked } />
			) }
			{ isLinked && (
				<AllInputControl
					aria-label={ label }
					{ ...inputControlProps }
				/>
			) }

			{ ! isLinked && splitOnAxis && (
				<AxialInputControls { ...inputControlProps } />
			) }
			{ ! isLinked && ! splitOnAxis && (
				<InputControls { ...inputControlProps } />
			) }
		</fieldset>
	);
}
