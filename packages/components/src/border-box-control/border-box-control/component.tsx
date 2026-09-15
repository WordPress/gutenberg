import { __ } from '@wordpress/i18n';
import { useMemo, useState } from '@wordpress/element';
import { useInstanceId, useMergeRefs } from '@wordpress/compose';
import BorderBoxControlLinkedButton from '../border-box-control-linked-button';
import BorderBoxControlSplitControls from '../border-box-control-split-controls';
import { BorderControl } from '../../border-control';
import BaseControl from '../../base-control';
import { Grid } from '../../grid';
import { View } from '../../view';
import { VisuallyHidden } from '../../visually-hidden';
import type { WordPressComponentProps } from '../../context';
import { contextConnect } from '../../context';
import { useBorderBoxControl } from './hook';
import type { BorderBoxControlProps } from '../types';
import type {
	LabelProps,
	BorderControlProps,
} from '../../border-control/types';

const BorderLabel = ( props: LabelProps & { id?: string } ) => {
	const { id, label, hideLabelFromVision } = props;

	if ( ! label ) {
		return null;
	}

	// The visible label is rendered as `BaseControl.VisualLabel` so it carries
	// the stable `.components-base-control__label` className consumers style
	// against; `StyledLabel` is an emotion component with a generated one.
	return hideLabelFromVision ? (
		<VisuallyHidden as="span" id={ id }>
			{ label }
		</VisuallyHidden>
	) : (
		<BaseControl.VisualLabel id={ id }>{ label }</BaseControl.VisualLabel>
	);
};

const UnconnectedBorderBoxControl = (
	props: WordPressComponentProps< BorderBoxControlProps, 'div', false >,
	forwardedRef: React.ForwardedRef< any >
) => {
	const {
		className,
		colors,
		disableCustomColors,
		disableUnits,
		enableAlpha,
		enableStyle,
		hasMixedBorders,
		hasVisibleLabel,
		headerClassName,
		hideLabelFromVision,
		isLinked,
		label,
		linkedControlClassName,
		linkedValue,
		onLinkedChange,
		onSplitChange,
		popoverPlacement,
		popoverOffset,
		splitValue,
		toggleLinked,
		wrapperClassName,
		__experimentalIsRenderedInSidebar,
		'aria-label': ariaLabel,
		'aria-labelledby': ariaLabelledBy,
		...otherProps
	} = useBorderBoxControl( props );

	// The label names the group of border controls rather than a single input,
	// so it is associated via `aria-labelledby` instead of `htmlFor`.
	const generatedLabelId = useInstanceId(
		BorderBoxControl,
		'border-box-control-label'
	);

	// A consumer-provided accessible name takes precedence, so the generated
	// relationship is only used as a fallback. Where an external name wins,
	// the unused ID is left off the internal label. Empty values are treated
	// as absent, matching the accessible name computation, which skips an
	// empty `aria-label` or `aria-labelledby` rather than resolving a name
	// from it.
	const labelId =
		label && ! ariaLabel && ! ariaLabelledBy ? generatedLabelId : undefined;

	// Use internal state instead of a ref to make sure that the component
	// re-renders when the popover's anchor updates.
	const [ popoverAnchor, setPopoverAnchor ] = useState< Element | null >(
		null
	);

	// Memoize popoverProps to avoid returning a new object every time.
	const popoverProps: BorderControlProps[ '__unstablePopoverProps' ] =
		useMemo(
			() =>
				popoverPlacement
					? {
							placement: popoverPlacement,
							offset: popoverOffset,
							anchor: popoverAnchor,
							shift: true,
					  }
					: undefined,
			[ popoverPlacement, popoverOffset, popoverAnchor ]
		);

	const mergedRef = useMergeRefs( [ setPopoverAnchor, forwardedRef ] );

	return (
		<View
			className={ className }
			// Whichever naming source wins, it describes the border controls
			// as a whole, so the wrapper needs a role for that accessible
			// name to attach to. Without a name there is no group to expose.
			role={ label || ariaLabel || ariaLabelledBy ? 'group' : undefined }
			aria-label={ ariaLabel }
			aria-labelledby={ ariaLabelledBy ?? labelId }
			{ ...otherProps }
			ref={ mergedRef }
		>
			{ hasVisibleLabel ? (
				// The toggle shares the label's row so that it lines up with
				// the equivalent toggle on sibling controls, e.g. the border
				// radius one.
				<Grid
					className={ headerClassName }
					columns={ 2 }
					templateColumns="1fr min-content"
					alignment="center"
				>
					<BorderLabel
						id={ labelId }
						label={ label }
						hideLabelFromVision={ hideLabelFromVision }
					/>
					<BorderBoxControlLinkedButton
						onClick={ toggleLinked }
						isLinked={ isLinked }
					/>
				</Grid>
			) : (
				<BorderLabel
					id={ labelId }
					label={ label }
					hideLabelFromVision={ hideLabelFromVision }
				/>
			) }
			<View className={ wrapperClassName }>
				{ isLinked ? (
					<BorderControl
						className={ linkedControlClassName }
						colors={ colors }
						disableUnits={ disableUnits }
						disableCustomColors={ disableCustomColors }
						enableAlpha={ enableAlpha }
						enableStyle={ enableStyle }
						onChange={ onLinkedChange }
						placeholder={
							hasMixedBorders ? __( 'Mixed' ) : undefined
						}
						__unstablePopoverProps={ popoverProps }
						shouldSanitizeBorder={ false } // This component will handle that.
						value={ linkedValue }
						withSlider
						width="116px"
						__experimentalIsRenderedInSidebar={
							__experimentalIsRenderedInSidebar
						}
					/>
				) : (
					<BorderBoxControlSplitControls
						colors={ colors }
						disableCustomColors={ disableCustomColors }
						enableAlpha={ enableAlpha }
						enableStyle={ enableStyle }
						onChange={ onSplitChange }
						popoverPlacement={ popoverPlacement }
						popoverOffset={ popoverOffset }
						value={ splitValue }
						__experimentalIsRenderedInSidebar={
							__experimentalIsRenderedInSidebar
						}
					/>
				) }
				{ /* With no label row to join, the toggle sits alongside the
				     inputs instead. */ }
				{ ! hasVisibleLabel && (
					<BorderBoxControlLinkedButton
						onClick={ toggleLinked }
						isLinked={ isLinked }
					/>
				) }
			</View>
		</View>
	);
};

/**
 * An input control for the color, style, and width of the border of a box. The
 * border can be customized as a whole, or individually for each side of the box.
 *
 * The controls are exposed as a group named by the `label` prop. Passing
 * `aria-labelledby` or `aria-label` names the group instead, taking precedence
 * over `label`; with none of the three, the wrapper is not exposed as a group.
 *
 * ```jsx
 * import { BorderBoxControl } from '@wordpress/components';
 * import { __ } from '@wordpress/i18n';
 *
 * const colors = [
 * 	{ name: 'Blue 20', color: '#72aee6' },
 * 	// ...
 * ];
 *
 * const MyBorderBoxControl = () => {
 * 	const defaultBorder = {
 * 		color: '#72aee6',
 * 		style: 'dashed',
 * 		width: '1px',
 * 	};
 * 	const [ borders, setBorders ] = useState( {
 * 		top: defaultBorder,
 * 		right: defaultBorder,
 * 		bottom: defaultBorder,
 * 		left: defaultBorder,
 * 	} );
 * 	const onChange = ( newBorders ) => setBorders( newBorders );
 *
 * 	return (
 * 		<BorderBoxControl
 * 			colors={ colors }
 * 			label={ __( 'Borders' ) }
 * 			onChange={ onChange }
 * 			value={ borders }
 * 		/>
 * 	);
 * };
 * ```
 */
export const BorderBoxControl = contextConnect(
	UnconnectedBorderBoxControl,
	'BorderBoxControl'
);

export default BorderBoxControl;
