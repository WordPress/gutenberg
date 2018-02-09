/**
 * External dependencies
 */
import classnames from 'classnames';

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
			<li className={ classnames( item.classes ) }>
				<a title={ item.title } rel={ item.xfn } href={ item.url } target="_blank">
					{ decodeEntities( item.title.trim() ) || __( '(Untitled)' ) }
				</a>
				{ children }
			</li>
		);
	}
}

export default MenuItem;
