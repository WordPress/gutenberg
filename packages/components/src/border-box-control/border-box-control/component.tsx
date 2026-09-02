import { __ } from '@wordpress/i18n';
import { useMemo, useState } from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';
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

const BorderLabel = ( props: LabelProps ) => {
	const { label, hideLabelFromVision } = props;

	if ( ! label ) {
		return null;
	}

	// The visible label is rendered as `BaseControl.VisualLabel` so it carries
	// the stable `.components-base-control__label` className consumers style
	// against; `StyledLabel` is an emotion component with a generated one.
	return hideLabelFromVision ? (
		<VisuallyHidden as="label">{ label }</VisuallyHidden>
	) : (
		<BaseControl.VisualLabel>{ label }</BaseControl.VisualLabel>
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
		...otherProps
	} = useBorderBoxControl( props );

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
		<View className={ className } { ...otherProps } ref={ mergedRef }>
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
