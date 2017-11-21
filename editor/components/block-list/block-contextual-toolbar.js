/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import NavigableToolbar from '../../navigable-toolbar';
import { BlockToolbar } from '../';
import { isFeatureActive } from '../../selectors';

function BlockContextualToolbar( { hasFixedToolbar } ) {
	if ( hasFixedToolbar ) {
		return null;
	}

	return (
		<NavigableToolbar
			className="editor-block-contextual-toolbar"
			aria-label={ __( 'Block Toolbar' ) }
		>
			<BlockToolbar />
		</NavigableToolbar>
	);
}

export default connect(
	( state ) => ( {
		hasFixedToolbar: isFeatureActive( state, 'fixedToolbar' ),
	} ),
)( BlockContextualToolbar );
