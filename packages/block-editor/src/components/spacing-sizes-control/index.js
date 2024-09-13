/**
 * WordPress dependencies
 */
import {
	BaseControl,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import AxialInputControls from './input-controls/axial';
import SeparatedInputControls from './input-controls/separated';
import SingleInputControl from './input-controls/single';
import LinkedButton from './linked-button';
import useSpacingSizes from './hooks/use-spacing-sizes';
import {
	ALL_SIDES,
	DEFAULT_VALUES,
	LABELS,
	VIEWS,
	getInitialView,
} from './utils';

export default function SpacingSizesControl( {
	inputProps,
	label: labelProp,
	minimumCustomValue = 0,
	onChange,
	onMouseOut,
	onMouseOver,
	showSideInLabel = true,
	sides = ALL_SIDES,
	useSelect,
	values,
} ) {
	const spacingSizes = useSpacingSizes();
	const inputValues = values || DEFAULT_VALUES;
	const hasOneSide = sides?.length === 1;
	const hasOnlyAxialSides =
		sides?.includes( 'horizontal' ) &&
		sides?.includes( 'vertical' ) &&
		sides?.length === 2;

	const [ view, setView ] = useState( getInitialView( inputValues, sides ) );

	const toggleLinked = () => {
		setView( view === VIEWS.axial ? VIEWS.custom : VIEWS.axial );
	};

	const handleOnChange = ( nextValue ) => {
		const newValues = { ...values, ...nextValue };
		onChange( newValues );
	};

	const inputControlProps = {
		...inputProps,
		minimumCustomValue,
		onChange: handleOnChange,
		onMouseOut,
		onMouseOver,
		sides,
		spacingSizes,
		type: labelProp,
		useSelect,
		values: inputValues,
	};

	const renderControls = () => {
		if ( view === VIEWS.axial ) {
			return <AxialInputControls { ...inputControlProps } />;
		}
		if ( view === VIEWS.custom ) {
			return <SeparatedInputControls { ...inputControlProps } />;
		}
		return (
			<SingleInputControl
				side={ view }
				{ ...inputControlProps }
				showSideInLabel={ showSideInLabel }
			/>
		);
	};

	const sideLabel =
		ALL_SIDES.includes( view ) && showSideInLabel ? LABELS[ view ] : '';

	const label = sprintf(
		// translators: 2. Type of spacing being modified (Padding, margin, etc). 1: The side of the block being modified (top, bottom, left etc.).
		__( '%1$s %2$s' ),
		labelProp,
		sideLabel
	).trim();

	return (
		<fieldset className="spacing-sizes-control">
			<HStack className="spacing-sizes-control__header">
				<BaseControl.VisualLabel
					as="legend"
					className="spacing-sizes-control__label"
				>
					{ label }
				</BaseControl.VisualLabel>
				{ ! hasOneSide && ! hasOnlyAxialSides && (
					<LinkedButton
						label={ labelProp }
						onClick={ toggleLinked }
						isLinked={ view === VIEWS.axial }
					/>
				) }
			</HStack>
			<VStack spacing={ 0.5 }>{ renderControls() }</VStack>
		</fieldset>
	);
}
