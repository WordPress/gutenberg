/**
 * Internal dependencies
 */
import { BarsView, BarsWrapperView, ContainerView } from './styles';
import { BASE_SIZE, WRAPPER_SIZE } from './utils';
import { contextConnect, useContextSystem } from '../context';
import { COLORS } from '../../utils/colors-values';

/* eslint-disable jsdoc/valid-types */
/**
 * @typedef Props
 * @property {import('react').CSSProperties['color']} [color]   Color of `Spinner`.
 * @property {number}                                 [size=16] Size of `Spinner`.
 */
/* eslint-enable jsdoc/valid-types */

/**
 *
 * @param {import('../context').WordPressComponentProps<Props, 'div'>} props
 * @param {import('react').ForwardedRef<any>}                          forwardedRef
 */
function Spinner( props, forwardedRef ) {
	const {
		color = COLORS.black,
		size = BASE_SIZE,
		...otherProps
	} = useContextSystem( props, 'Spinner' );
	const ratio = size / BASE_SIZE;
	const scale = ( ratio * BASE_SIZE ) / WRAPPER_SIZE;
	const transform = `scale(${ scale })`;

	const styles = { transform };

	return (
		<ContainerView
			{ ...otherProps }
			aria-busy={ true }
			ref={ forwardedRef }
			style={ { height: size, width: size } }
		>
			<BarsWrapperView aria-hidden={ true } style={ styles }>
				<BarsView style={ { color } }>
					<div className="InnerBar1" />
					<div className="InnerBar2" />
					<div className="InnerBar3" />
					<div className="InnerBar4" />
					<div className="InnerBar5" />
					<div className="InnerBar6" />
					<div className="InnerBar7" />
					<div className="InnerBar8" />
					<div className="InnerBar9" />
					<div className="InnerBar10" />
					<div className="InnerBar11" />
					<div className="InnerBar12" />
				</BarsView>
			</BarsWrapperView>
		</ContainerView>
	);
}

/**
 * `Spinner` is a component that notify users that their action is being processed.
 *
 * @example
 * ```jsx
 * import { Spinner } from `@wordpress/components/ui`;
 *
 * function Example() {
 * 	return (
 * 		<Spinner />
 * 	);
 * }
 * ```
 */
export default contextConnect( Spinner, 'Spinner' );
