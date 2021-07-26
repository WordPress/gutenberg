/**
 * External dependencies
 */
import { map } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Spinner } from '@wordpress/components';
import { store as editorStore } from '@wordpress/editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { BlockPreview } from '@wordpress/block-editor';
import { useMemo } from '@wordpress/element';
import { parse } from '@wordpress/blocks';

export default function TemplatePreview( { templateId } ) {
	console.error('TemplatePreview');
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

	const blocks = useMemo( () => {
		if ( ! template?.content?.raw ) {
			return [];
		}
		return parse( template.content.raw );
	}, [ template ] );
	console.log({ blocks, template });
	const defaultBlockContext = useMemo( () => {
		return { postId, postType };
	}, [ postId, postType ] );

	return ! isResolved ? (
		<Spinner />
	) : (
		<BlockPreview blocks={ blocks } context={ defaultBlockContext } />
	);
}
