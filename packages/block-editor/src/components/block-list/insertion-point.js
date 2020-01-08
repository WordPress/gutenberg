/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import Inserter from '../inserter';

export default function BlockInsertionPoint( { rootClientId, clientId, onBlur, onFocus, width } ) {
	const showInsertionPoint = useSelect( ( select ) => {
		const {
			getBlockIndex,
			getBlockInsertionPoint,
			isBlockInsertionPointVisible,
		} = select( 'core/block-editor' );
		const blockIndex = getBlockIndex( clientId, rootClientId );
		const insertionPoint = getBlockInsertionPoint();
		return (
			isBlockInsertionPointVisible() &&
			insertionPoint.index === blockIndex &&
			insertionPoint.rootClientId === rootClientId
		);
	}, [ clientId, rootClientId ] );

	return (
		<div className="block-editor-block-list__insertion-point" style={ { width } }>
			{ showInsertionPoint && (
				<div className="block-editor-block-list__insertion-point-indicator" />
			) }
			<div
				onFocus={ onFocus }
				onBlur={ onBlur }
				// While ideally it would be enough to capture the
				// bubbling focus event from the Inserter, due to the
				// characteristics of click focusing of `button`s in
				// Firefox and Safari, it is not reliable.
				//
				// See: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#Clicking_and_focus
				tabIndex={ -1 }
				className="block-editor-block-list__insertion-point-inserter"
			>
				<Inserter
					rootClientId={ rootClientId }
					clientId={ clientId }
				/>
			</div>
		</div>
	);
}
