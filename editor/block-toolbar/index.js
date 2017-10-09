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

/**
 * Internal Dependencies
 */
import './style.scss';
import BlockSwitcher from '../block-switcher';
import BlockMover from '../block-mover';
import BlockRightMenu from '../block-settings-menu';

function FirstChild( { children } ) {
	const childrenArray = Children.toArray( children );
	return childrenArray[ 0 ] || null;
}

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
				<div className={ toolbarClassname }>
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

export default BlockToolbar;
