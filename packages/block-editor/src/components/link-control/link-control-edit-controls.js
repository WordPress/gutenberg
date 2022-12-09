/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import { useLinkControlContext } from './';

export default function LinkControlEditControls( { children } ) {
	const { showTextControl, shouldShowEditControls } = useLinkControlContext();

	if ( ! shouldShowEditControls ) {
		return null;
	}

	return (
		<>
			<div
				className={ classnames( {
					'block-editor-link-control__search-input-wrapper': true,
					'has-text-control': showTextControl,
				} ) }
			>
				{ children }
			</div>
		</>
	);
}
