/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Warning from '../warning';

export default class BlockInvalidWarning extends Component {
	render() {
		const title = __( 'Problem displaying block' );
		return (
			<Warning
				title={ title }
				icon={ this.props.icon }
				accessible={ true }
				accessibilityLabel={ title }
			/>
		);
	}
}
