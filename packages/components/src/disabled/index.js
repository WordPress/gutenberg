/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __experimentalUseDisabled as useDisabled } from '@wordpress/compose';
import { createContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { StyledWrapper } from './styles/disabled-styles';

const Context = createContext( false );
const { Consumer, Provider } = Context;

/**
 * @typedef OwnProps
 * @property {string}                    [className]       Classname for the disabled element.
 * @property {import('react').ReactNode} children          Children to disable.
 * @property {boolean}                   [isDisabled=true] Whether to disable the children.
 */

/**
 * @param {OwnProps & import('react').HTMLAttributes<HTMLDivElement>} props
 * @return {JSX.Element} Element wrapping the children to disable them when isDisabled is true.
 */
function Disabled( { className, children, isDisabled = true, ...props } ) {
	/** @type {import('react').RefCallback<HTMLDivElement>} */
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
