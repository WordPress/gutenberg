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

export default function MosaicTemplatePreview( {
	className,
	templateId,
	onClick,
} ) {
	const { isResolved, templateContent, postId, postType } = useSelect(
		( select ) => {
			const { getEntityRecord, hasFinishedResolution } = select(
				coreStore
			);
			const { getCurrentPostId, getCurrentPostType } = select(
				editorStore
			);
			const getEntityArgs = [ 'postType', 'wp_template', templateId ];
			const template = templateId
				? getEntityRecord( ...getEntityArgs )
				: null;
			const hasResolvedEntity = templateId
				? hasFinishedResolution( 'getEntityRecord', getEntityArgs )
				: false;

			return {
				templateContent: template?.content?.raw,
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
		<Spinner className={ className } />
	) : (
		<TemplatePreview
			onClick={ onClick }
			className={ className }
			rawContent={ templateContent }
			context={ defaultBlockContext }
		/>
	);
}
