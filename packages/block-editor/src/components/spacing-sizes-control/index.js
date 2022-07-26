/**
 * External dependencies
 */
import classnames from 'classnames';

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
import { settings } from '@wordpress/icons';

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

export default function SpacingSizesControl( {
	inputProps = defaultInputProps,
	onChange,
	label = __( 'Spacing Control' ),
	values,
	sides,
	splitOnAxis = false,
	useSelect,
} ) {
	const [ showCustomValueControl, setShowCustomValueControl ] =
		useState( false );

	const spacingSizes = [
		{ name: 0, slug: '0', size: 0 },
		...useSetting( 'spacing.spacingSizes' ),
	];

	const type = label;
	const inputValues = values || DEFAULT_VALUES;
	const hasInitialValue = isValuesDefined( values );
	const hasOneSide = sides?.length === 1;

	const [ isLinked, setIsLinked ] = useState(
		! hasInitialValue || ! isValuesMixed( inputValues ) || hasOneSide
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
		type,
	};

	return (
		<fieldset role="region" className="component-spacing-sizes-control">
			<HStack
				className={ classnames(
					'component-spacing-sizes-control__header',
					{
						'component-spacing-sizes-control__header-is-linked':
							isLinked,
					}
				) }
			>
				<Text as="legend">{ label }</Text>
				{ isLinked && (
					<Button
						label={
							showCustomValueControl
								? __( 'Use size preset' )
								: __( 'Set custom size' )
						}
						icon={ settings }
						onClick={ () => {
							setShowCustomValueControl(
								! showCustomValueControl
							);
						} }
						isPressed={ showCustomValueControl }
						isSmall
						className="components-spacing-sizes-control__custom-toggle"
					/>
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
					showCustomValueControl={ showCustomValueControl }
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
