/**
 * External dependencies
 */
import classnames from 'classnames';
import type { RefCallback } from 'react';

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

const Context = createContext< boolean >( false );
const { Consumer, Provider } = Context;

function Disabled( {
	className,
	children,
	isDisabled = true,
	...props
}: DisabledProps ) {
	const ref: RefCallback< HTMLDivElement > = useDisabled();

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
