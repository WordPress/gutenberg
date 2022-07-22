/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	Button,
	__experimentalHStack as HStack,
	__experimentalText as Text,
} from '@wordpress/components';

/**
 * Internal dependencies
 */

import AllInputControl from './all-input-control';
import InputControls from './input-controls';
import AxialInputControls from './axial-input-controls';
import LinkedButton from './linked-button';
import { DEFAULT_VALUES, isValuesMixed, isValuesDefined } from './utils';
import useSetting from '../use-setting';

const defaultInputProps = {
	min: 0,
};

const noop = () => {};

export default function SpacingSizesControl( {
	inputProps = defaultInputProps,
	onChange = noop,
	label = __( 'Spacing Control' ),
	values,
	sides,
	splitOnAxis = false,
	allowReset = true,
	resetValues = DEFAULT_VALUES,
	useSelect,
} ) {
	const spacingSizes = [
		{ name: 0, slug: '0', size: 0 },
		...useSetting( 'spacing.spacingSizes' ),
	];
	//const [ values, setValues ] = useState( valuesProp );
	const inputValues = values || DEFAULT_VALUES;
	const hasInitialValue = isValuesDefined( values );
	const hasOneSide = sides?.length === 1;

	const [ isDirty, setIsDirty ] = useState( hasInitialValue );
	const [ isLinked, setIsLinked ] = useState(
		! hasInitialValue || ! isValuesMixed( inputValues ) || hasOneSide
	);

	const toggleLinked = () => {
		setIsLinked( ! isLinked );
	};

	const handleOnChange = ( nextValue ) => {
		const newValues = { ...values, ...nextValue };
		onChange( newValues );
		setIsDirty( true );
	};

	const handleOnReset = () => {
		onChange( resetValues );
		setIsDirty( false );
	};

	const inputControlProps = {
		...inputProps,
		onChange: handleOnChange,
		isLinked,
		sides,
		values: inputValues,
		spacingSizes,
		useSelect,
	};

	return (
		<fieldset role="region" className="component-spacing-sizes-control">
			<HStack className="component-spacing-sizes-control__header">
				<Text as="legend">{ label }</Text>
				{ allowReset && (
					<Button
						className="component-box-control__reset-button"
						isSecondary
						isSmall
						onClick={ handleOnReset }
						disabled={ ! isDirty }
					>
						{ __( 'Reset' ) }
					</Button>
				) }
				{ ! hasOneSide && (
					<LinkedButton
						onClick={ toggleLinked }
						isLinked={ isLinked }
					/>
				) }
			</HStack>

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
