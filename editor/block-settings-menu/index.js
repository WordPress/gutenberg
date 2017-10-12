/**
 * External dependencies
 */
import classnames from 'classnames';
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { IconButton } from '@wordpress/components';
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';
import BlockSettingsMenuContent from './content';
import { selectBlock } from '../actions';

class BlockSettingsMenu extends Component {
	constructor() {
		super( ...arguments );
		this.toggleMenu = this.toggleMenu.bind( this );
		this.state = {
			opened: false,
		};
	}

	toggleMenu() {
		// Block could be hovered, not selected.
		if ( this.props.uids.length === 1 ) {
			this.props.onSelect( this.props.uids[ 0 ] );
		}

		this.setState( ( state ) => ( {
			opened: ! state.opened,
		} ) );
	}

	render() {
		const { opened } = this.state;
		const { uids, focus } = this.props;
		const toggleClassname = classnames( 'editor-block-settings-menu__toggle', 'editor-block-settings-menu__control', {
			'is-opened': opened,
		} );

		return (
			<div className="editor-block-settings-menu">
				<IconButton
					className={ toggleClassname }
					onClick={ this.toggleMenu }
					icon="ellipsis"
					label={ opened ? __( 'Close Settings Menu' ) : __( 'Open Settings Menu' ) }
					focus={ focus }
				/>

				{ opened && <BlockSettingsMenuContent uids={ uids } /> }
			</div>
		);
	}
}

export default connect(
	undefined,
	( dispatch ) => ( {
		onSelect( uid ) {
			dispatch( selectBlock( uid ) );
		},
	} )
)( BlockSettingsMenu );
