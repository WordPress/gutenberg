/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { Button } from '@wordpress/components';
import { __, isRTL } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import { chevronLeft, chevronRight } from '@wordpress/icons';
import { store as editorStore } from '@wordpress/editor';
import { store as coreStore } from '@wordpress/core-data';

function FullscreenModeClose( { showTooltip, icon, href, initialPost } ) {
	const postType = useSelect(
		( select ) => {
			const { getCurrentPostType } = select( editorStore );
			const { getPostType } = select( coreStore );
			return getPostType( initialPost?.type || getCurrentPostType() );
		},
		[ initialPost?.type ]
	);

	if ( ! postType ) {
		return null;
	}

	const buttonHref =
		href ??
		addQueryArgs( 'edit.php', {
			post_type: postType.slug,
		} );

	const buttonLabel = postType?.labels?.view_items ?? __( 'Back' );

	return (
		<Button
			size="compact"
			href={ buttonHref }
			label={ buttonLabel }
			showTooltip={ showTooltip }
			tooltipPosition="bottom"
			icon={ icon ?? ( isRTL() ? chevronRight : chevronLeft ) }
		/>
	);
}

export default FullscreenModeClose;
