/**
 * WordPress dependencies
 */
import {
	Icon,
	Button,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalText as Text,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { moreVertical } from '@wordpress/icons';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import {
	TEMPLATE_POST_TYPE,
	TEMPLATE_PART_POST_TYPE,
} from '../../store/constants';
import { unlock } from '../../lock-unlock';
import PostActions from '../post-actions';
import usePageTypeBadge from '../../utils/pageTypeBadge';
import { getTemplateInfo } from '../../utils/get-template-info';
const { Badge } = unlock( componentsPrivateApis );

/**
 * Renders a title of the post type and the available quick actions available within a 3-dot dropdown.
 *
 * @param {Object}          props                     - Component props.
 * @param {string}          [props.postType]          - The post type string.
 * @param {string|string[]} [props.postId]            - The post id or list of post ids.
 * @param {Function}        [props.onActionPerformed] - A callback function for when a quick action is performed.
 * @return {React.ReactNode} The rendered component.
 */
export default function PostCardPanel( {
	postType,
	postId,
	onActionPerformed,
} ) {
	const postIds = useMemo(
		() => ( Array.isArray( postId ) ? postId : [ postId ] ),
		[ postId ]
	);
	const { postTitle, icon, labels, isRevision } = useSelect(
		( select ) => {
			const { getEditedEntityRecord, getCurrentTheme, getPostType } =
				select( coreStore );
			const {
				getPostIcon,
				getCurrentPostType,
				isRevisionsMode,
				getCurrentRevision,
			} = unlock( select( editorStore ) );
			let _title = '';

			// In revisions mode, use the current revision.
			if ( isRevisionsMode() ) {
				const parentPostType = getCurrentPostType();
				const _record = getCurrentRevision();
				_title = _record?.title?.rendered || _record?.title?.raw || '';
				return {
					postTitle: _title,
					icon: getPostIcon( parentPostType, {
						area: _record?.area,
					} ),
					labels: getPostType( parentPostType )?.labels,
					isRevision: true,
				};
			}

			const _record = getEditedEntityRecord(
				'postType',
				postType,
				postIds[ 0 ]
			);
			if ( postIds.length === 1 ) {
				const { default_template_types: templateTypes = [] } =
					getCurrentTheme() ?? {};

				const _templateInfo = [
					TEMPLATE_POST_TYPE,
					TEMPLATE_PART_POST_TYPE,
				].includes( postType )
					? getTemplateInfo( {
							template: _record,
							templateTypes,
					  } )
					: {};
				_title = _templateInfo?.title || _record?.title;
			}

			return {
				postTitle: _title,
				icon: getPostIcon( postType, {
					area: _record?.area,
				} ),
				labels: getPostType( postType )?.labels,
			};
		},
		[ postIds, postType ]
	);

	const pageTypeBadge = usePageTypeBadge( postId );
	let title = __( 'No title' );
	if ( labels?.name && postIds.length > 1 ) {
		title = sprintf(
			// translators: %1$d number of selected items %2$s: Name of the plural post type e.g: "Posts".
			__( '%1$d %2$s' ),
			postIds.length,
			labels?.name
		);
	} else if ( postTitle ) {
		title = stripHTML( postTitle );
	}

	return (
		<VStack spacing={ 1 } className="editor-post-card-panel">
			<HStack
				spacing={ 2 }
				className="editor-post-card-panel__header"
				alignment="flex-start"
			>
				<Icon className="editor-post-card-panel__icon" icon={ icon } />
				<Text
					numberOfLines={ 2 }
					truncate
					className="editor-post-card-panel__title"
					as="h2"
				>
					<span className="editor-post-card-panel__title-name">
						{ title }
					</span>
					{ pageTypeBadge && postIds.length === 1 && (
						<Badge>{ pageTypeBadge }</Badge>
					) }
				</Text>
				{ postIds.length === 1 && (
					<>
						{ isRevision ? (
							<Button
								size="small"
								icon={ moreVertical }
								label={ __( 'Actions' ) }
								disabled
								accessibleWhenDisabled
								className="editor-all-actions-button"
							/>
						) : (
							<PostActions
								postType={ postType }
								postId={ postIds[ 0 ] }
								onActionPerformed={ onActionPerformed }
							/>
						) }
					</>
				) }
			</HStack>
			{ postIds.length > 1 && (
				<Text className="editor-post-card-panel__description">
					{ sprintf(
						// translators: %s: Name of the plural post type e.g: "Posts".
						__( 'Changes will be applied to all selected %s.' ),
						labels?.name.toLowerCase()
					) }
				</Text>
			) }
		</VStack>
	);
}
