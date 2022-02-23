/**
 * Internal dependencies
 */
import { useFlyoutContext } from '../context';
import { FlyoutContentView, CardView } from '../styles';
import { contextConnect, useContextSystem } from '../../ui/context';

/**
 *
 * @param {import('../../ui/context').WordPressComponentProps<import('../types').ContentProps, 'div', false>} props
 * @param {import('react').ForwardedRef<any>}                                                                 forwardedRef forwardedRef
 */
function FlyoutContent( props, forwardedRef ) {
	const {
		children,
		elevation,
		maxWidth,
		style = {},
		...otherProps
	} = useContextSystem( props, 'FlyoutContent' );

	const { label, flyoutState } = useFlyoutContext();

	if ( ! flyoutState ) {
		throw new Error(
			'`FlyoutContent` must only be used inside a `Flyout`.'
		);
	}

	const showContent = flyoutState.visible || flyoutState.animating;

	return (
		<FlyoutContentView
			aria-label={ label }
			// maxWidth is applied via inline styles in order to avoid the `React does
			// not recognize the maxWidth prop on a DOM element` error that comes from
			// passing `maxWidth` as a prop to `FlyoutContentView`
			style={ { maxWidth, ...style } }
			{ ...otherProps }
			{ ...flyoutState }
		>
			{ showContent && (
				<CardView elevation={ elevation } ref={ forwardedRef }>
					{ children }
				</CardView>
			) }
		</FlyoutContentView>
	);
}

const ConnectedFlyoutContent = contextConnect( FlyoutContent, 'FlyoutContent' );

export default ConnectedFlyoutContent;
