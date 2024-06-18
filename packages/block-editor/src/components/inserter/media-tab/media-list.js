/**
 * WordPress dependencies
 */
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { MediaPreview } from './media-preview';
import { unlock } from '../../../lock-unlock';

const { CompositeV2: Composite, useCompositeStoreV2: useCompositeStore } =
	unlock( componentsPrivateApis );

function MediaList( {
	mediaList,
	category,
	onClick,
	label = __( 'Media List' ),
} ) {
	const compositeStore = useCompositeStore();
	return (
		<Composite
			store={ compositeStore }
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
