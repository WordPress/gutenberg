/**
 * WordPress dependencies
 */
import {
	BaseControl,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { _x, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import useSpacingSizes from './hooks/use-spacing-sizes';
import AxialInputControls from './input-controls/axial';
import SeparatedInputControls from './input-controls/separated';
import SingleInputControl from './input-controls/single';
import LinkedButton from './linked-button';
import {
	ALL_SIDES,
	DEFAULT_VALUES,
	LABELS,
	VIEWS,
	getInitialView,
} from './utils';

/**
 * A flexible control for managing spacing values in the block editor. Supports single, axial,
 * and separated input controls for different spacing configurations with automatic view selection
 * based on current values and available sides.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/spacing-sizes-control/README.md
 *
 * @example
 * ```jsx
 * import { __experimentalSpacingSizesControl as SpacingSizesControl } from '@wordpress/block-editor';
 * import { useState } from '@wordpress/element';
 *
 * function Example() {
 *   const [ sides, setSides ] = useState( {
 *     top: '0px',
 *     right: '0px',
 *     bottom: '0px',
 *     left: '0px',
 *   } );
 *
 *   return (
 *     <SpacingSizesControl
 *       values={ sides }
 *       onChange={ setSides }
 *       label="Sides"
 *     />
 *   );
 * }
 * ```
 *
 * @param {Object}   props                    Component props.
 * @param {Object}   props.inputProps         Additional props for input controls.
 * @param {string}   props.label              Label for the control.
 * @param {number}   props.minimumCustomValue Minimum value for custom input.
 * @param {Function} props.onChange           Called when spacing values change.
 * @param {Function} props.onMouseOut         Called when mouse leaves the control.
 * @param {Function} props.onMouseOver        Called when mouse enters the control.
 * @param {boolean}  props.showSideInLabel    Show side in control label.
 * @param {Array}    props.sides              Available sides for control.
 * @param {boolean}  props.useSelect          Use select control for predefined values.
 * @param {Object}   props.values             Current spacing values.
 * @return {Element}                         Spacing sizes control component.
 */
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
		// translators: 1: The side of the block being modified (top, bottom, left etc.). 2. Type of spacing being modified (padding, margin, etc).
		_x( '%1$s %2$s', 'spacing' ),
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
