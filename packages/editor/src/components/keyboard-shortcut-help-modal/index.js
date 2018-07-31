/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { Modal, KeyboardShortcuts } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { rawShortcut } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import shortcutConfig from './config';

class KeyboardShortcutHelpModal extends Component {
	constructor( ...args ) {
		super( ...args );

		this.toggleModalVisibility = this.toggleModalVisibility.bind( this );

		this.state = {
			isModalVisible: false,
		};
	}

	toggleModalVisibility() {
		const isModalVisible = ! this.state.isModalVisible;
		this.setState( {
			isModalVisible,
		} );
	}

	render() {
		return (
			<Fragment>
				<KeyboardShortcuts
					bindGlobal
					shortcuts={ {
						[ rawShortcut.primary( '/' ) ]: this.toggleModalVisibility,
					} }
				/>
				{ this.state.isModalVisible && (
					<Modal
						title={ __( 'Keyboard Shortcuts' ) }
						closeLabel={ __( 'Close' ) }
						onRequestClose={ this.toggleModalVisibility }
					>
						<dl>
							{ shortcutConfig.map( ( { key, description }, index ) => (
								<Fragment key={ index }>
									<dt>{ key }</dt>
									<dd>{ description }</dd>
								</Fragment>
							) ) }
						</dl>
					</Modal>
				) }
			</Fragment>
		);
	}
}

export default KeyboardShortcutHelpModal;
