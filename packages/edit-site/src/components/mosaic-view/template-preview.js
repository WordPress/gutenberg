/**
 * WordPress dependencies
 */
import { Spinner } from '@wordpress/components';
import { store as editorStore } from '@wordpress/editor';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import TemplatePreview from '../navigation-sidebar/navigation-panel/template-preview';

export default function MosaicTemplatePreview( { templateId } ) {
	const { isResolved, template, postId, postType } = useSelect(
		( select ) => {
			const { getEntityRecord, hasFinishedResolution } = select(
				coreStore
			);
			const { getCurrentPostId, getCurrentPostType } = select(
				editorStore
			);
			const getEntityArgs = [ 'postType', 'wp_template', templateId ];
			const entityRecord = templateId
				? getEntityRecord( ...getEntityArgs )
				: null;
			const hasResolvedEntity = templateId
				? hasFinishedResolution( 'getEntityRecord', getEntityArgs )
				: false;

			return {
				template: entityRecord,
				isResolved: hasResolvedEntity,
				postId: getCurrentPostId(),
				postType: getCurrentPostType(),
			};
		},
		[ templateId ]
	);

	const defaultBlockContext = useMemo( () => {
		return { postId, postType };
	}, [ postId, postType ] );

	return ! isResolved ? (
		<Spinner />
	) : (
		<TemplatePreview
			rawContent={ template?.content?.raw }
			context={ defaultBlockContext }
		/>
	);
}
