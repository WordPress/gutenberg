/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useRef } from '@wordpress/element';
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
import type { LabelProps } from '../../border-control/types';

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
		__next36pxDefaultSize = false,
		...otherProps
	} = useBorderBoxControl( props );
	const containerRef = useRef();
	const mergedRef = useMergeRefs( [ containerRef, forwardedRef ] );
	const popoverProps = popoverPlacement
		? {
				placement: popoverPlacement,
				offset: popoverOffset,
				anchorRef: containerRef,
				__unstableShift: true,
		  }
		: undefined;

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
						__next36pxDefaultSize={ __next36pxDefaultSize }
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
						__next36pxDefaultSize={ __next36pxDefaultSize }
					/>
				) }
				<BorderBoxControlLinkedButton
					onClick={ toggleLinked }
					isLinked={ isLinked }
					__next36pxDefaultSize={ __next36pxDefaultSize }
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
