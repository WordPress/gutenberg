import { connect } from 'react-redux';


/**
 * External dependencies
 */
import { Slot } from 'react-slot-fill';
import CSSTransitionGroup from 'react-transition-group/CSSTransitionGroup';
import classnames from 'classnames';

/**
 * WordPress Dependencies
 */
import { IconButton, Toolbar } from '@wordpress/components';
import { Component, Children } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { focus, keycodes } from '@wordpress/utils';

/**
 * Internal Dependencies
 */
import './style.scss';
import BlockSwitcher from '../block-switcher';
import BlockMover from '../block-mover';
import BlockRightMenu from '../block-settings-menu';
import {
	focusBlock,
} from '../actions';

/**
 * Module Constants
 */
const { LEFT, RIGHT, ESCAPE, F10 } = keycodes;

function FirstChild( { children } ) {
	const childrenArray = Children.toArray( children );
	return childrenArray[ 0 ] || null;
}

function isMac() {
	return window.navigator.platform.toLowerCase().indexOf( 'mac' ) !== -1;
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
		this.stopPropagation = this.stopPropagation.bind( this );
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
		this.toolbar = ref;
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

	stopPropagation( event ) {
		// This is required to avoid messing up with the WritingFlow navigation
		event.stopPropagation();
	}

	onKeyUp( event ) {
		const shouldFocusToolbar = this.metaCount === 1 || ( event.keyCode === F10 && event.altKey );
		this.metaCount = 0;

		if ( ! shouldFocusToolbar && [ ESCAPE, LEFT, RIGHT ].indexOf( event.keyCode ) === -1 ) {
			return;
		}

		const tabbables = focus.tabbable.find( this.toolbar );
		const indexOfTabbable = tabbables.indexOf( document.activeElement );

		if ( shouldFocusToolbar ) {
			if ( tabbables.length ) {
				tabbables[ 0 ].focus();
			}
			return;
		}

		switch ( event.keyCode ) {
			case ESCAPE: {
			 // fire an action
				this.props.onRefocusBlock();
				// // Is there a better way to focus the selected block
				// const selectedBlock = document.querySelector( '.editor-visual-editor__block.is-selected' );
				// if ( indexOfTabbable !== -1 && selectedBlock ) {
				// 	selectedBlock.focus();
				// }
				break;
			}
			case LEFT:
				if ( indexOfTabbable > 0 ) {
					tabbables[ indexOfTabbable - 1 ].focus();
				}
				event.stopPropagation();
				break;
			case RIGHT:
				if ( indexOfTabbable !== -1 && indexOfTabbable !== tabbables.length - 1 ) {
					tabbables[ indexOfTabbable + 1 ].focus();
				}
				event.stopPropagation();
				break;
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
				<div className={ toolbarClassname } ref={ this.bindNode } onKeyDown={ this.stopPropagation }>
					<div className="editor-block-toolbar__group">
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
				</div>
			</CSSTransitionGroup>
		);
	}
}

export default connect(
	( ) => {
		return { };
	},
	( dispatch, ownProps ) => ( {
		onRefocusBlock() {
			dispatch( focusBlock( ownProps.uid ) );
		},
	} )
)( BlockToolbar );
