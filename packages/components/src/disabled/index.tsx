/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { disabledStyles } from './styles/disabled-styles';
import type { DisabledProps } from './types';
import type { WordPressComponentProps } from '../context';
import { useCx } from '../utils';

const Context = createContext< boolean >( false );
const { Consumer, Provider } = Context;

/**
 * `Disabled` is a component which disables descendant tabbable elements and
 * prevents pointer interaction.
 *
 * _Note: this component may not behave as expected in browsers that don't
 * support the `inert` HTML attribute. We recommend adding the official WICG
 * polyfill when using this component in your project._
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/inert
 *
 * ```jsx
 * import { Button, Disabled, TextControl } from '@wordpress/components';
 * import { useState } from '@wordpress/element';
 *
 * const MyDisabled = () => {
 * 	const [ isDisabled, setIsDisabled ] = useState( true );
 *
 * 	let input = <TextControl label="Input" onChange={ () => {} } />;
 * 	if ( isDisabled ) {
 * 		input = <Disabled>{ input }</Disabled>;
 * 	}
 *
 * 	const toggleDisabled = () => {
 * 		setIsDisabled( ( state ) => ! state );
 * 	};
 *
 * 	return (
 * 		<div>
 * 			{ input }
 * 			<Button variant="primary" onClick={ toggleDisabled }>
 * 				Toggle Disabled
 * 			</Button>
 * 		</div>
 * 	);
 * };
 * ```
 */
function Disabled( {
	className,
	children,
	isDisabled = true,
	...props
}: WordPressComponentProps< DisabledProps, 'div' > ) {
	const cx = useCx();

	return (
		<Provider value={ isDisabled }>
			<div
				// @ts-ignore Reason: inert is a recent HTML attribute
				inert={ isDisabled ? 'true' : undefined }
				className={
					isDisabled
						? cx( disabledStyles, className, 'components-disabled' )
						: undefined
				}
				{ ...props }
			>
				{ children }
			</div>
		</Provider>
	);
}

Disabled.Context = Context;
Disabled.Consumer = Consumer;

export default Disabled;
