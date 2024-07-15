/**
 * WordPress dependencies
 */
import { Composite } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { MediaPreview } from './media-preview';

function MediaList( {
	mediaList,
	category,
	onClick,
	label = __( 'Media List' ),
} ) {
	return (
		<Composite
			role="listbox"
			className="block-editor-inserter__media-list"
			aria-label={ label }
		>
			{ mediaList.map( ( media, index ) => (
				<MediaPreview
					key={ media.id || media.sourceId || index }
					media={ media }
					category={ category }
					onClick={ onClick }
				/>
			) ) }
		</Composite>
	);
}

export default MediaList;
