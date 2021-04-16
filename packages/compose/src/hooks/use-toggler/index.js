/**
 * WordPress dependencies
 */
import { useCallback, useRef, useState } from '@wordpress/element';

/**
 * @typedef  {Object}    TogglerHookReturnValue
 * @property {Object}    togglerHandlers   Event handlers for toggler element.
 * @property {boolean}   isOn              State of toggler.
 * @property {Function}  setIsOn           Sets toggler state
 * @property {Function}  offUnlessToggler  Sets state, if toggler element is
 *                                         not pressed, to false.
 */

/**
 * Facilitates disclosure/toggle components. It returns state with a setter,
 * event handlers for the toggle commponent and a function `offUnlessToggler`
 * to be used by the disclosed component for auto-closing with deferral to the
 * toggle component in case it was pressed.
 *
 * @return {TogglerHookReturnValue} State and handlers for content disclosures
 */
export default function useToggler() {
	const [ isOn, setIsOn ] = useState( false );

	const isTogglerPressed = useRef();
	const togglerHandlers = useRef();
	if ( ! togglerHandlers.current ) {
		togglerHandlers.current = {
			onMouseDown: () => ( isTogglerPressed.current = true ),
			onMouseUp: () => ( isTogglerPressed.current = false ),
			onClick: ( { currentTarget: { disabled, ariaDisabled } } ) => {
				if ( disabled || ( ariaDisabled && ariaDisabled === 'true' ) ) {
					return;
				}
				setIsOn( ( current ) => ! current );
			},
		};
	}

	const offUnlessToggler = useCallback(
		() => ! isTogglerPressed.current && setIsOn( false ),
		[]
	);

	return {
		togglerHandlers: togglerHandlers.current,
		isOn,
		setIsOn,
		offUnlessToggler,
	};
}
