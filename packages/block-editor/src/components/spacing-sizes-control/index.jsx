import {
	BaseControl,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useState, useEffect, useRef } from '@wordpress/element';
import { _x, sprintf } from '@wordpress/i18n';
import { usePrevious } from '@wordpress/compose';
import { useSettings } from '../use-settings';
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
 * @param {Object}                                  props                    Component props.
 * @param {Object}                                  props.inputProps         Additional props for input controls.
 * @param {string}                                  props.label              Label for the control.
 * @param {boolean}                                 props.linkedByDefault    Whether sides are linked by default when no values are defined.
 * @param {number}                                  props.minimumCustomValue Minimum value for custom input.
 * @param {( values: Object ) => void}              props.onChange           Called when spacing values change.
 * @param {( event: React.SyntheticEvent ) => void} props.onMouseOut         Called when mouse leaves the control.
 * @param {( event: React.SyntheticEvent ) => void} props.onMouseOver        Called when mouse enters the control.
 * @param {boolean}                                 props.showSideInLabel    Show side in control label.
 * @param {Array}                                   props.sides              Available sides for control.
 * @param {boolean}                                 props.useSelect          Use select control for predefined values.
 * @param {Object}                                  props.values             Current spacing values.
 * @return {Element}                         Spacing sizes control component.
 */
export default function SpacingSizesControl( {
	inputProps,
	label: labelProp,
	linkedByDefault: linkedByDefaultProp,
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
	const [ linkedByDefaultSetting = true ] = useSettings(
		'spacing.linkedByDefault'
	);
	// If linkedByDefault is an object, callers (like DimensionsPanel) resolve
	// the explicit margin/padding boolean prop. For standalone use where the prop
	// is omitted, fall back to boolean settings or default to true.
	const resolvedSetting =
		typeof linkedByDefaultSetting === 'boolean'
			? linkedByDefaultSetting
			: true;
	const linkedByDefault = linkedByDefaultProp ?? resolvedSetting;
	const inputValues = values || DEFAULT_VALUES;
	const inputValuesRef = useRef( inputValues );

	useEffect( () => {
		inputValuesRef.current = inputValues;
	}, [ inputValues ] );

	const hasOneSide = sides?.length === 1;
	const hasOnlyAxialSides =
		sides?.includes( 'horizontal' ) &&
		sides?.includes( 'vertical' ) &&
		sides?.length === 2;

	const [ view, setView ] = useState( () =>
		getInitialView( inputValues, sides, linkedByDefault )
	);

	const prevLinkedByDefault = usePrevious( linkedByDefault );
	const prevSides = usePrevious( sides );
	const hasUserToggledRef = useRef( false );

	useEffect( () => {
		const isFirstRender =
			prevLinkedByDefault === undefined && prevSides === undefined;
		if ( isFirstRender ) {
			return;
		}

		const hasLinkedByDefaultChanged =
			prevLinkedByDefault !== linkedByDefault;
		const haveSidesChanged = prevSides !== sides;

		// Re-initialize view if sides or linkedByDefault changed.
		// When supported sides change, constraints of the new configuration must
		// take precedence over any prior user toggle.
		if ( haveSidesChanged || hasLinkedByDefaultChanged ) {
			if ( haveSidesChanged ) {
				hasUserToggledRef.current = false;
				setView(
					getInitialView(
						inputValuesRef.current,
						sides,
						linkedByDefault
					)
				);
			} else if (
				! hasUserToggledRef.current ||
				hasLinkedByDefaultChanged
			) {
				setView(
					getInitialView(
						inputValuesRef.current,
						sides,
						linkedByDefault
					)
				);
			}
		}
	}, [ linkedByDefault, prevLinkedByDefault, prevSides, sides ] );

	const toggleLinked = () => {
		hasUserToggledRef.current = true;
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
		// translators: 1: Type of spacing being modified (Padding, Margin, etc.). 2: The side of the block being modified (Top, Bottom, Left, etc.).
		_x( '%1$s %2$s', 'spacing control label' ),
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
