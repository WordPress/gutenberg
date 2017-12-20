/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress Dependencies
 */
import { Slot } from '@wordpress/components';
import { Component } from '@wordpress/element';

/**
 * Internal Dependencies
 */
import './style.scss';
import BlockSwitcher from '../block-switcher';
import { getBlockMode, getSelectedBlock } from '../../store/selectors';

class BlockToolbar extends Component {
	render() {
		const { block, mode } = this.props;

		if ( ! block || ! block.isValid ) {
			return null;
		}

		// Disable reason: Toolbar itself is non-interactive, but must capture
		// bubbling events from children to determine focus shift intents.
		/* eslint-disable jsx-a11y/no-static-element-interactions */
		return (
			<div className="editor-block-toolbar">
				{ mode === 'visual' && [
					<BlockSwitcher key="switcher" uids={ [ block.uid ] } />,
					<Slot key="slot" name="Formatting.Toolbar" />,
				] }
			</div>
		);
		/* eslint-enable jsx-a11y/no-static-element-interactions */
	}
}

export default connect( ( state ) => {
	const block = getSelectedBlock( state );

	return ( {
		block,
		mode: block ? getBlockMode( state, block.uid ) : null,
	} );
} )( BlockToolbar );
