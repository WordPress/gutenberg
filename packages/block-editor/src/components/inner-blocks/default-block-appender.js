/**
 * External dependencies
 */
import { last } from 'lodash';

/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import IgnoreNestedEvents from '../ignore-nested-events';
import DefaultBlockAppender from '../default-block-appender';
import withClientId from './utils/with-client-id';

export default compose( [
	withClientId,
	withSelect( ( select, { clientId } ) => {
		const {
			getBlockOrder,
		} = select( 'core/block-editor' );

		const blockClientIds = getBlockOrder( clientId );

		return {
			lastBlockClientId: last( blockClientIds ),
		};
	} ),
] )( function( { clientId, lastBlockClientId } ) {
	return (
		<IgnoreNestedEvents childHandledEvents={ [ 'onFocus', 'onClick', 'onKeyDown' ] }>
			<DefaultBlockAppender
				rootClientId={ clientId }
				lastBlockClientId={ lastBlockClientId }
			/>
		</IgnoreNestedEvents>
	);
} );
