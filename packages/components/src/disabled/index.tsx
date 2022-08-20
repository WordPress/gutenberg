/**
 * WordPress dependencies
 */
import { useDisabled } from '@wordpress/compose';
import { createContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { disabledStyles } from './styles/disabled-styles';
import type { DisabledProps } from './types';
import type { WordPressComponentProps } from '../ui/context';
import { useCx } from '../utils';

const Context = createContext< boolean >( false );
const { Consumer, Provider } = Context;

/**
 * `Disabled` is a component which disables descendant tabbable elements and prevents pointer interaction.
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
	const ref = useDisabled();
	const cx = useCx();
	if ( ! isDisabled ) {
		return (
			<Provider value={ false }>
				<div>{ children }</div>
			</Provider>
		);
	}

	return (
		<Provider value={ true }>
			<div
				ref={ ref }
				className={ cx(
					disabledStyles,
					className,
					'components-disabled'
				) }
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
