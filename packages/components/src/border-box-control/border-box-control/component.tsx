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
import { HStack } from '../../h-stack';
import { StyledLabel } from '../../base-control/styles/base-control-styles';
import { View } from '../../view';
import { VisuallyHidden } from '../../visually-hidden';
import { contextConnect, WordPressComponentProps } from '../../ui/context';
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

const BorderBoxControl = (
	props: WordPressComponentProps< BorderBoxControlProps, 'div' >,
	forwardedRef: React.ForwardedRef< any >
) => {
	const {
		className,
		colors,
		disableCustomColors,
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
		splitValue,
		toggleLinked,
		__experimentalHasMultipleOrigins,
		__experimentalIsRenderedInSidebar,
		__next40pxDefaultSize = false,
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
			<HStack alignment={ 'start' } expanded={ true } spacing={ 0 }>
				{ isLinked ? (
					<BorderControl
						className={ linkedControlClassName }
						colors={ colors }
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
						withSlider={ true }
						width={ '110px' }
						__experimentalHasMultipleOrigins={
							__experimentalHasMultipleOrigins
						}
						__experimentalIsRenderedInSidebar={
							__experimentalIsRenderedInSidebar
						}
						__next40pxDefaultSize={ __next40pxDefaultSize }
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
						__experimentalHasMultipleOrigins={
							__experimentalHasMultipleOrigins
						}
						__experimentalIsRenderedInSidebar={
							__experimentalIsRenderedInSidebar
						}
						__next40pxDefaultSize={ __next40pxDefaultSize }
					/>
				) }
				<BorderBoxControlLinkedButton
					onClick={ toggleLinked }
					isLinked={ isLinked }
					__next40pxDefaultSize={ __next40pxDefaultSize }
				/>
			</HStack>
		</View>
	);
};

const ConnectedBorderBoxControl = contextConnect(
	BorderBoxControl,
	'BorderBoxControl'
);

export default ConnectedBorderBoxControl;
