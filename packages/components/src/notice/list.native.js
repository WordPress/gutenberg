/**
 * External dependencies
 */
import classnames from 'classnames';
import { noop, omit } from 'lodash';
import {
	View,
} from 'react-native';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { withDispatch, withSelect } from '@wordpress/data';
import { compose, withPreferredColorScheme } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import Notice from './';
import styles from './style.scss';

class NoticeList extends Component {

	constructor( props ) {
        super( ...arguments );
        this.state = { noticeArray: [] }
    }
    
    render() {
        const { notices, onRemove = noop, className, children } = this.props;
        const removeNotice = ( id ) => () => onRemove( id );
    
        return (
            <View style={ styles.list }>
                { children }
                { [ ...notices ].reverse().map( ( notice ) => (
                    <Notice
                        { ...notice }
                        key={ notice.id }
                        onRemove={ removeNotice( notice.id ) }
                    >
                    
                    </Notice>
                ) ) }
            </View>
        );
    }
}

export default compose( [
	withSelect( ( select, ownProps ) => {
		const { getNotices } = select( 'core/editor' );
        const notices = getNotices();

		return {
			notices,
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { removeNotice, removeAllNotices } = dispatch( 'core/editor' );

		return {
			removeNotice,
			removeAllNotices,
		};
	} ),
] )( NoticeList );