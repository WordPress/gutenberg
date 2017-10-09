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
		this.props.onSelect();
		this.setState( ( state ) => ( {
			opened: ! state.opened,
		} ) );
	}

	render() {
		const { opened } = this.state;
		const { uid } = this.props;
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
				/>

				{ opened && <BlockSettingsMenuContent uid={ uid } /> }
			</div>
		);
	}
}

export default connect(
	undefined,
	( dispatch, ownProps ) => ( {
		onSelect() {
			dispatch( selectBlock( ownProps.uid ) );
		},
	} )
)( BlockSettingsMenu );
