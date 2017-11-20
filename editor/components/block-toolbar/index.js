/**
 * External dependencies
 */
import classnames from 'classnames';
import { connect } from 'react-redux';

/**
 * WordPress Dependencies
 */
import { IconButton, Toolbar, Slot } from '@wordpress/components';
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal Dependencies
 */
import './style.scss';
import BlockSwitcher from '../block-switcher';
import BlockMover from '../block-mover';
import BlockInspectorButton from '../block-settings-menu/block-inspector-button';
import BlockModeToggle from '../block-settings-menu/block-mode-toggle';
import BlockDeleteButton from '../block-settings-menu/block-delete-button';
import UnknownConverter from '../block-settings-menu/unknown-converter';
import { getBlockMode, getSelectedBlock } from '../../state/selectors';

class BlockToolbar extends Component {
	constructor() {
		super( ...arguments );
		this.toggleMobileControls = this.toggleMobileControls.bind( this );
		this.state = {
			showMobileControls: false,
		};
	}

	toggleMobileControls() {
		this.setState( ( state ) => ( {
			showMobileControls: ! state.showMobileControls,
		} ) );
	}

	render() {
		const { showMobileControls } = this.state;
		const { block, mode } = this.props;

		if ( ! block || ! block.isValid ) {
			return null;
		}

		const toolbarClassname = classnames( 'editor-block-toolbar', {
			'is-showing-mobile-controls': showMobileControls,
		} );

		// Disable reason: Toolbar itself is non-interactive, but must capture
		// bubbling events from children to determine focus shift intents.
		/* eslint-disable jsx-a11y/no-static-element-interactions */
		return (
			<div className={ toolbarClassname }>
				{ ! showMobileControls && mode === 'visual' && [
					<BlockSwitcher key="switcher" uids={ [ block.uid ] } />,
					<Slot key="slot" name="Formatting.Toolbar" />,
				] }
				<Toolbar className="editor-block-toolbar__mobile-tools">
					<div>
						{ mode === 'visual' &&
							<IconButton
								className="editor-block-toolbar__mobile-toggle"
								onClick={ this.toggleMobileControls }
								aria-expanded={ showMobileControls }
								label={ __( 'Toggle extra controls' ) }
								icon="ellipsis"
							/>
						}
					</div>

					{ ( mode === 'html' || showMobileControls ) &&
						<div className="editor-block-toolbar__mobile-tools-content">
							<BlockMover uids={ [ block.uid ] } />
							<BlockInspectorButton small />
							<BlockModeToggle uid={ block.uid } small />
							<UnknownConverter uid={ block.uid } small />
							<BlockDeleteButton uids={ [ block.uid ] } small />
						</div>
					}
				</Toolbar>
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
