/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useDisabled } from '@wordpress/compose';
import { createContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { StyledWrapper } from './styles/disabled-styles';
import type { DisabledProps } from './types';
import type { WordPressComponentProps } from '../ui/context';

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

	if ( ! isDisabled ) {
		return <Provider value={ false }>{ children }</Provider>;
	}

	return (
		<Provider value={ true }>
			<StyledWrapper
				ref={ ref }
				className={ classnames( className, 'components-disabled' ) }
				{ ...props }
			>
				{ children }
			</StyledWrapper>
		</Provider>
	);
}

Disabled.Context = Context;
Disabled.Consumer = Consumer;

export default Disabled;
