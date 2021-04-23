/**
 * External dependencies
 */
import { cx, ui } from '@wp-g2/styles';
// eslint-disable-next-line no-restricted-imports
import { Radio as ReakitRadio } from 'reakit';

/**
 * WordPress dependencies
 */
import { Icon, chevronDown } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { contextConnect } from '../context';
import { useButtonGroupContext } from '../button-group';
import { Elevation } from '../elevation';
import { FlexItem } from '../flex';
import { View } from '../view';
import * as styles from './styles';
import LoadingOverlay from './loading-overlay';
import { useBaseButton } from './hook';

/**
 * @param {import('../context').ViewOwnProps<import('./types').Props, 'button'>} props
 * @param {import('react').Ref<any>} forwardedRef
 */
function BaseButton( props, forwardedRef ) {
	const {
		as: asProp,
		children,
		disabled = false,
		elevation = 0,
		elevationActive,
		elevationFocus,
		elevationHover,
		hasCaret = false,
		href,
		icon,
		iconPosition = 'left',
		iconSize = 16,
		isActive = false,
		isDestructive = false,
		isFocused = false,
		isLoading = false,
		noWrap = true,
		pre,
		suffix,
		...otherProps
	} = useBaseButton( props );
	const { buttonGroup } = useButtonGroupContext();
	const buttonGroupState = buttonGroup || {};

	const BaseComponent = buttonGroup ? ReakitRadio : View;
	const as = asProp || ( href && ! disabled ? 'a' : 'button' );

	return (
		// @ts-ignore No idea why TS is confused about this but ReakitRadio and View are definitely renderable
		<BaseComponent
			aria-busy={ isLoading }
			as={ as }
			data-active={ isActive }
			data-destructive={ isDestructive }
			data-focused={ isFocused }
			data-icon={ !! icon }
			disabled={ disabled || isLoading }
			href={ href }
			{ ...buttonGroupState }
			{ ...otherProps }
			ref={ forwardedRef }
		>
			<LoadingOverlay isLoading={ isLoading } />
			{ pre && (
				<FlexItem
					as="span"
					className={ cx(
						styles.PrefixSuffix,
						isLoading && styles.loading
					) }
					{ ...ui.$( 'ButtonPrefix' ) }
				>
					{ pre }
				</FlexItem>
			) }
			{ icon && iconPosition === 'left' && (
				<FlexItem
					as="span"
					className={ cx(
						styles.PrefixSuffix,
						isLoading && styles.loading
					) }
					{ ...ui.$( 'ButtonIcon' ) }
				>
					<Icon icon={ icon } size={ iconSize } />
				</FlexItem>
			) }
			{ children && (
				<FlexItem
					as="span"
					className={ cx(
						styles.Content,
						isLoading && styles.loading,
						noWrap && styles.noWrap
					) }
					isBlock
					{ ...ui.$( 'ButtonContent' ) }
				>
					{ children }
				</FlexItem>
			) }
			{ icon && iconPosition === 'right' && (
				<FlexItem
					as="span"
					className={ cx(
						styles.PrefixSuffix,
						isLoading && styles.loading
					) }
					{ ...ui.$( 'ButtonIcon' ) }
				>
					<Icon icon={ icon } size={ iconSize } />
				</FlexItem>
			) }
			{ suffix && (
				<FlexItem
					as="span"
					className={ cx(
						styles.PrefixSuffix,
						isLoading && styles.loading
					) }
					{ ...ui.$( 'ButtonSuffix' ) }
				>
					{ suffix }
				</FlexItem>
			) }
			{ hasCaret && (
				<FlexItem
					as="span"
					className={ cx(
						styles.CaretWrapper,
						isLoading && styles.loading
					) }
					{ ...ui.$( 'ButtonCaret' ) }
				>
					<Icon icon={ chevronDown } size={ 16 } />
				</FlexItem>
			) }
			<Elevation
				active={ elevationActive }
				as="span"
				focus={ elevationFocus }
				hover={ elevationHover }
				offset={ -1 }
				value={ elevation }
				{ ...ui.$( 'ButtonElevation' ) }
			/>
		</BaseComponent>
	);
}

/**
 * `BaseButton` is a primitive component used to create actionable components (e.g. `Button`).
 */
const ConnectedBaseButton = contextConnect( BaseButton, 'BaseButton' );

export default ConnectedBaseButton;
