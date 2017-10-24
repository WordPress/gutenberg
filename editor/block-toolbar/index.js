/**
 * External dependencies
 */
import { Slot } from 'react-slot-fill';
import CSSTransitionGroup from 'react-transition-group/CSSTransitionGroup';
import classnames from 'classnames';

/**
 * WordPress Dependencies
 */
import { IconButton, Toolbar, NavigableMenu } from '@wordpress/components';
import { Component, Children, findDOMNode } from '@wordpress/element';
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

/**
 * Module Constants
 */
const { ESCAPE, F10 } = keycodes;

function FirstChild( { children } ) {
	const childrenArray = Children.toArray( children );
	return childrenArray[ 0 ] || null;
}

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
									<BlockInspectorButton small />
									<BlockModeToggle uid={ uid } small />
									<BlockDeleteButton uids={ [ uid ] } small />
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
