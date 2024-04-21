/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../../store';

/**
 * When the browser is about to auto correct, add an undo level so the user can
 * revert the change.
 *
 * @param {Object} props The component to be rendered.
 */
export default ( props ) => {
	return ( element ) => {
		function onInput( event ) {
			if ( event.inputType === 'insertReplacementText' ) {
				const { registry } = props.current;
				registry
					.dispatch( blockEditorStore )
					.__unstableMarkLastChangeAsPersistent();
			}
		}

		element.addEventListener( 'beforeinput', onInput );
		return () => {
			element.removeEventListener( 'beforeinput', onInput );
		};
	};
};
