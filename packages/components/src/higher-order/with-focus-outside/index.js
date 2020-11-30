/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';
import { createHigherOrderComponent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import useFocusOutside from '../../utils/hooks/use-focus-outside';

export default createHigherOrderComponent(
	( WrappedComponent ) => ( props ) => {
		const ref = useRef();
		const onFocusOutside = ref.current?.handleFocusOutside;
		const {
			onFocus,
			onMouseDown,
			onMouseUp,
			onTouchStart,
			onTouchEnd,
			onBlur,
		} = useFocusOutside( onFocusOutside );

		return (
			// Disable reason: See `normalizeButtonFocus` for browser-specific
			// focus event normalization.

			/* eslint-disable jsx-a11y/no-static-element-interactions */
			<div
				onFocus={ onFocus }
				onMouseDown={ onMouseDown }
				onMouseUp={ onMouseUp }
				onTouchStart={ onTouchStart }
				onTouchEnd={ onTouchEnd }
				onBlur={ onBlur }
			>
				<WrappedComponent ref={ ref } { ...props } />
			</div>
			/* eslint-enable jsx-a11y/no-static-element-interactions */
		);
	},
	'withFocusOutside'
);
