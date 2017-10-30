/**
 * External dependencies
 */
import { Slot, Fill } from 'react-slot-fill';
import classnames from 'classnames';
import { connect } from 'react-redux';

/**
 * WordPress Dependencies
 */
import { IconButton, Toolbar, NavigableMenu } from '@wordpress/components';
import { Component, findDOMNode } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { focus, keycodes } from '@wordpress/utils';

/**
 * Internal Dependencies
 */
import './style.scss';
import BlockSwitcher from '../block-switcher';
import BlockMover from '../block-mover';
import BlockInspectorButton from '../block-settings-menu/block-inspector-button';
import BlockModeToggle from '../block-settings-menu/block-mode-toggle';
import BlockDeleteButton from '../block-settings-menu/block-delete-button';
import { isMac } from '../utils/dom';
import { getBlockMode } from '../selectors';

import { focusBlockEdit } from '../actions';

/**
 * Module Constants
 */
const { ESCAPE, F10 } = keycodes;

function metaKeyPressed( event ) {
	return isMac() ? event.metaKey : ( event.ctrlKey && ! event.altKey );
}

class BlockToolbar extends Component {
	constructor() {
		super( ...arguments );
		this.toggleMobileControls = this.toggleMobileControls.bind( this );
		this.bindNode = this.bindNode.bind( this );
		this.onKeyUp = this.onKeyUp.bind( this );
		this.onKeyDown = this.onKeyDown.bind( this );
		this.onToolbarKeyDown = this.onToolbarKeyDown.bind( this );
		this.state = {
			showMobileControls: false,
		};

		// it's not easy to know if the user only clicked on a "meta" key without simultaneously clicking on another key
		// We keep track of the key counts to ensure it's reliable
		this.metaCount = 0;
	}

	componentDidMount() {
		document.addEventListener( 'keyup', this.onKeyUp );
		document.addEventListener( 'keydown', this.onKeyDown );
	}

	componentWillUnmount() {
		document.removeEventListener( 'keyup', this.onKeyUp );
		document.removeEventListener( 'keydown', this.onKeyDown );
	}

	bindNode( ref ) {
		// Disable reason: Need DOM node for finding first focusable element
		// on keyboard interaction to shift to toolbar.
		// eslint-disable-next-line react/no-find-dom-node
		this.toolbar = findDOMNode( ref );
	}

	toggleMobileControls() {
		this.setState( ( state ) => ( {
			showMobileControls: ! state.showMobileControls,
		} ) );
	}

	onKeyDown( event ) {
		if ( metaKeyPressed( event ) ) {
			this.metaCount++;
		}
	}

	onKeyUp( event ) {
		const shouldFocusToolbar = this.metaCount === 1 || ( event.keyCode === F10 && event.altKey );
		this.metaCount = 0;

		if ( shouldFocusToolbar ) {
			const tabbables = focus.tabbable.find( this.toolbar );
			if ( tabbables.length ) {
				tabbables[ 0 ].focus();
			}
		}
	}

	onToolbarKeyDown( event ) {
		if ( event.keyCode !== ESCAPE ) {
			return;
		}

		this.props.focusBlockEdit();
		event.stopPropagation();
	}

	render() {
		const { showMobileControls } = this.state;
		const { uid, mode } = this.props;

		const toolbarClassname = classnames( 'editor-block-toolbar', {
			'is-showing-mobile-controls': showMobileControls,
		} );

		// Disable reason: Toolbar itself is non-interactive, but must capture
		// bubbling events from children to determine focus shift intents.
		/* eslint-disable jsx-a11y/no-static-element-interactions */
		return (
			<Fill name="Editor.Header">
				<NavigableMenu
					className={ toolbarClassname }
					ref={ this.bindNode }
					orientation="horizontal"
					role="toolbar"
					deep
					onKeyDown={ this.onToolbarKeyDown }
					aria-label={ __( 'Block\'s toolbar' ) }
				>
					{ ! showMobileControls && mode === 'visual' && [
						<BlockSwitcher key="switcher" uid={ uid } />,
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
								<BlockMover uids={ [ uid ] } />
								<BlockInspectorButton small />
								<BlockModeToggle uid={ uid } small />
								<BlockDeleteButton uids={ [ uid ] } small />
							</div>
						}
					</Toolbar>
				</NavigableMenu>
			</Fill>
		);
		/* eslint-enable jsx-a11y/no-static-element-interactions */
	}
}

export default connect(
	( state, ownProps ) => ( {
		mode: getBlockMode( state, ownProps.uid ),
	} ),

	( dispatch, ownProps ) => ( {
		focusBlockEdit( ) {
			dispatch( focusBlockEdit( ownProps.uid ) )
		},
	} ),
)( BlockToolbar );
