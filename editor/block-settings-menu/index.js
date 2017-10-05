/**
 * External dependencies
 */
import classnames from 'classnames';

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

class BlockSettingsMenu extends Component {
	constructor() {
		super( ...arguments );
		this.toggleMenu = this.toggleMenu.bind( this );
		this.state = {
			opened: false,
		};
	}

	toggleMenu() {
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
					aria-label={ __( 'Open Settings Menu' ) }
				/>

				{ opened && <BlockSettingsMenuContent uid={ uid } /> }
			</div>
		);
	}
}

export default BlockSettingsMenu;
