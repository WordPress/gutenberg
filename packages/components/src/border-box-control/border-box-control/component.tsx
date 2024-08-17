/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useMemo, useState } from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BorderBoxControlLinkedButton from '../border-box-control-linked-button';
import BorderBoxControlSplitControls from '../border-box-control-split-controls';
import { BorderControl } from '../../border-control';
import { StyledLabel } from '../../base-control/styles/base-control-styles';
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

	return hideLabelFromVision ? (
		<VisuallyHidden as="label">{ label }</VisuallyHidden>
	) : (
		<StyledLabel>{ label }</StyledLabel>
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
		hideLabelFromVision,
		isLinked,
		label,
		linkedControlClassName,
		linkedValue,
		onLinkedChange,
		onSplitChange,
		popoverPlacement,
		popoverOffset,
		size,
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
			<BorderLabel
				label={ label }
				hideLabelFromVision={ hideLabelFromVision }
			/>
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
						width={
							size === '__unstable-large' ? '116px' : '110px'
						}
						__experimentalIsRenderedInSidebar={
							__experimentalIsRenderedInSidebar
						}
						size={ size }
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
						size={ size }
					/>
				) }
				<BorderBoxControlLinkedButton
					onClick={ toggleLinked }
					isLinked={ isLinked }
					size={ size }
				/>
			</View>
		</View>
	);
};

/**
 * The `BorderBoxControl` effectively has two view states. The first, a "linked"
 * view, allows configuration of a flat border via a single `BorderControl`.
 * The second, a "split" view, contains a `BorderControl` for each side
 * as well as a visualizer for the currently selected borders. Each view also
 * contains a button to toggle between the two.
 *
 * When switching from the "split" view to "linked", if the individual side
 * borders are not consistent, the "linked" view will display any border
 * properties selections that are consistent while showing a mixed state for
 * those that aren't. For example, if all borders had the same color and style
 * but different widths, then the border dropdown in the "linked" view's
 * `BorderControl` would show that consistent color and style but the "linked"
 * view's width input would show "Mixed" placeholder text.
 *
 * ```jsx
 * import { __experimentalBorderBoxControl as BorderBoxControl } from '@wordpress/components';
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
