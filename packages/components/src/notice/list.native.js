/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { withDispatch, withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import Notice from './';
import styles from './style.scss';

class NoticeList extends Component {
	constructor() {
		super( ...arguments );
		this.removeNotice = this.removeNotice.bind( this );
	}

	removeNotice( id ) {
		const { removeNotice } = this.props;
		removeNotice( id );
	}

	render() {
		const { notices, shouldStack } = this.props;

		if ( ! notices.length ) {
			return null;
		}

		return (
			<View style={ styles.list } key={ notices.length }>
				{ shouldStack ? (
					notices
						.reverse()
						.map( ( notice ) => (
							<Notice
								{ ...notice }
								key={ notice.id }
								onNoticeHidden={ this.removeNotice }
							></Notice>
						) )
				) : (
					<Notice
						{ ...notices[ notices.length - 1 ] }
						onNoticeHidden={ this.removeNotice }
					></Notice>
				) }
			</View>
		);
	}
}

export default compose( [
	withSelect( ( select ) => {
		const { getNotices } = select( 'core/notices' );

		return {
			notices: getNotices(),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { removeNotice } = dispatch( 'core/notices' );

		return {
			removeNotice,
		};
	} ),
] )( NoticeList );
