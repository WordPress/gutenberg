/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { decodeEntities } from '@wordpress/utils';

class MenuItem extends Component {
	render() {
		const { children, item } = this.props;

		return (
			<li>
				<a href={ item.url } target="_blank">
					{ decodeEntities( item.title.trim() ) || __( '(Untitled)' ) }
				</a>
				{ children }
			</li>
		);
	}
}

export default MenuItem;
