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
		const classes = classnames( item.classes, {
			'menu-item-has-children': !! children,
		} );

		return (
			<li className={ classes }>
				<a title={ item.title } rel={ item.xfn } href={ item.url } target="_blank">
					{ decodeEntities( item.title.trim() ) || __( '(Untitled)' ) }
				</a>
				{ children }
			</li>
		);
	}
}

export default MenuItem;
