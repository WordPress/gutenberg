/**
 * External dependencies
 */
import CSSTransitionGroup from 'react-transition-group/CSSTransitionGroup';
import classnames from 'classnames';

/**
 * WordPress Dependencies
 */
import { IconButton, Toolbar, NavigableMenu, Slot, KeyboardShortcuts } from '@wordpress/components';
import { Component, Children, findDOMNode } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { focus, keycodes } from '@wordpress/utils';

/**
 * Internal Dependencies
 */
import './style.scss';
import BlockSwitcher from '../block-switcher';
import BlockMover from '../block-mover';
import BlockRightMenu from '../block-settings-menu';

/**
 * Module Constants
 */
const { ESCAPE } = keycodes;

function FirstChild( { children } ) {
	const childrenArray = Children.toArray( children );
	return childrenArray[ 0 ] || null;
}

class BlockToolbar extends Component {
	constructor() {
		super( ...arguments );

		this.toggleMobileControls = this.toggleMobileControls.bind( this );
		this.bindNode = this.bindNode.bind( this );
		this.focusToolbar = this.focusToolbar.bind( this );
		this.onToolbarKeyDown = this.onToolbarKeyDown.bind( this );

		this.state = {
			showMobileControls: false,
		};
	}

	bindNode( ref ) {
		this.toolbar = findDOMNode( ref );
	}

	toggleMobileControls() {
		this.setState( ( state ) => ( {
			showMobileControls: ! state.showMobileControls,
		} ) );
	}

	focusToolbar() {
		const tabbables = focus.tabbable.find( this.toolbar );
		if ( tabbables.length ) {
			tabbables[ 0 ].focus();
		}
	}

	onToolbarKeyDown( event ) {
		if ( event.keyCode !== ESCAPE ) {
			return;
		}

		// Is there a better way to focus the selected block
		// TODO: separate focused/selected block state and use Redux actions instead
		const selectedBlock = document.querySelector( '.editor-visual-editor__block.is-selected .editor-visual-editor__block-edit' );
		if ( !! selectedBlock ) {
			event.stopPropagation();
			selectedBlock.focus();
		}
	}

	render() {
		const { showMobileControls } = this.state;
		const { uid } = this.props;

		const toolbarClassname = classnames( 'editor-block-toolbar', {
			'is-showing-mobile-controls': showMobileControls,
		} );

		return (
			<CSSTransitionGroup
				transitionName={ { appear: 'is-appearing', appearActive: 'is-appearing-active' } }
				transitionAppear={ true }
				transitionAppearTimeout={ 100 }
				transitionEnter={ false }
				transitionLeave={ false }
				component={ FirstChild }
			>
				<NavigableMenu
					className={ toolbarClassname }
					ref={ this.bindNode }
					orientation="horizontal"
					role="toolbar"
					deep
				>
					<KeyboardShortcuts
						bindGlobal
						eventName="keyup"
						shortcuts={ {
							mod: this.focusToolbar,
							'alt+f10': this.focusToolbar,
						} }
					/>
					<div className="editor-block-toolbar__group" onKeyDown={ this.onToolbarKeyDown }>
						{ ! showMobileControls && [
							<BlockSwitcher key="switcher" uid={ uid } />,
							<Slot key="slot" name="Formatting.Toolbar" />,
						] }
						<Toolbar className="editor-block-toolbar__mobile-tools">
							<IconButton
								className="editor-block-toolbar__mobile-toggle"
								onClick={ this.toggleMobileControls }
								aria-expanded={ showMobileControls }
								label={ __( 'Toggle extra controls' ) }
								icon="ellipsis"
							/>

							{ showMobileControls &&
								<div className="editor-block-toolbar__mobile-tools-content">
									<BlockMover uids={ [ uid ] } />
									<BlockRightMenu uid={ uid } />
								</div>
							}
						</Toolbar>
					</div>
				</NavigableMenu>
			</CSSTransitionGroup>
		);
	}
}

export default BlockToolbar;
