/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

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
		popoverClassNames,
		splitValue,
		toggleLinked,
		__experimentalHasMultipleOrigins,
		__experimentalIsRenderedInSidebar,
		...otherProps
	} = useBorderBoxControl( props );

	return (
		<View className={ className } { ...otherProps } ref={ forwardedRef }>
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
						popoverContentClassName={ popoverClassNames?.linked }
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
					/>
				) : (
					<BorderBoxControlSplitControls
						colors={ colors }
						disableCustomColors={ disableCustomColors }
						enableAlpha={ enableAlpha }
						enableStyle={ enableStyle }
						onChange={ onSplitChange }
						popoverClassNames={ popoverClassNames }
						value={ splitValue }
						__experimentalHasMultipleOrigins={
							__experimentalHasMultipleOrigins
						}
						__experimentalIsRenderedInSidebar={
							__experimentalIsRenderedInSidebar
						}
					/>
				) }
				<BorderBoxControlLinkedButton
					onClick={ toggleLinked }
					isLinked={ isLinked }
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
