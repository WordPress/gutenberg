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

function EditorNotices( props ) {
	return (
		<NoticeList { ...props }>
			<TemplateValidationNotice />
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
