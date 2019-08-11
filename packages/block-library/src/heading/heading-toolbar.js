/**
 * External dependencies
 */
import { range } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { withViewportMatch } from '@wordpress/viewport';
import { withBlockEditContext } from '@wordpress/block-editor';
import { withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { Toolbar } from '@wordpress/components';

class HeadingToolbar extends Component {
	createLevelControl( targetLevel, selectedLevel, onChange ) {
		return {
			icon: 'heading',
			// translators: %s: heading level e.g: "1", "2", "3"
			title: sprintf( __( 'Heading %d' ), targetLevel ),
			isActive: targetLevel === selectedLevel,
			onClick: () => onChange( targetLevel ),
			subscript: String( targetLevel ),
		};
	}

	render() {
		const { isCollapsed, minLevel, maxLevel, selectedLevel, onChange } = this.props;

		return (
			<Toolbar
				isCollapsed={ isCollapsed }
				icon={ 'heading' }
				controls={ range( minLevel, maxLevel ).map(
					( index ) => this.createLevelControl( index, selectedLevel, onChange )
				) } />
		);
	}
}

export default compose(
	withBlockEditContext( ( { clientId } ) => {
		return {
			clientId,
		};
	} ),
	withViewportMatch( { isLargeViewport: 'medium' } ),
	withSelect( ( select, { clientId, isLargeViewport, isCollapsed } ) => {
		const { getBlockRootClientId, getSettings } = select( 'core/block-editor' );
		return {
			isCollapsed: isCollapsed || ! isLargeViewport || (
				! getSettings().hasFixedToolbar &&
				getBlockRootClientId( clientId )
			),
		};
	} ),
)( HeadingToolbar );
