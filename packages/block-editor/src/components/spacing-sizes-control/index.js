/**
 * WordPress dependencies
 */
import {
	BaseControl,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import AxialInputControls from './input-controls/axial';
import SeparatedInputControls from './input-controls/separated';
import SingleInputControl from './input-controls/single';
import SidesDropdown from './sides-dropdown';
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
	labels = LABELS,
	minimumCustomValue = 0,
	onChange,
	onMouseOut,
	onMouseOver,
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
	const label = labels[ view ] || labels.default;

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
		type: labels.default,
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
		return <SingleInputControl side={ view } { ...inputControlProps } />;
	};

	return (
		<fieldset className="components-spacing-sizes-control">
			<HStack className="components-spacing-sizes-control__header">
				<BaseControl.VisualLabel as="legend">
					{ label }
				</BaseControl.VisualLabel>
				{ ! hasOneSide && ! hasOnlyAxialSides && (
					<SidesDropdown
						onChange={ setView }
						sides={ sides }
						value={ view }
					/>
				) }
			</HStack>
			{ renderControls() }
		</fieldset>
	);
}
