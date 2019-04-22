/**
 * External dependencies
 */
import { filter } from 'lodash';

/**
 * WordPress dependencies
 */
import { NoticeList } from '@wordpress/components';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import TemplateValidationNotice from '../template-validation-notice';

export function EditorNotices( { dismissible, notices, ...props } ) {
	if ( dismissible !== undefined ) {
		notices = filter( notices, { isDismissible: dismissible } );
	}

	return (
		<NoticeList notices={ notices } { ...props }>
			{ dismissible !== false && (
				<TemplateValidationNotice />
			) }
		</NoticeList>
	);
}

export default compose( [
	withSelect( ( select ) => ( {
		notices: select( 'core/notices' ).getNotices(),
	} ) ),
	withDispatch( ( dispatch ) => ( {
		onRemove: dispatch( 'core/notices' ).removeNotice,
	} ) ),
] )( EditorNotices );
