/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	Icon,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalText as Text,
	PanelBody,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import {
	TEMPLATE_POST_TYPE,
	TEMPLATE_PART_POST_TYPE,
	PATTERN_POST_TYPE,
} from '../../store/constants';
import { PrivatePostExcerptPanel } from '../post-excerpt/panel';
import PostLastEditedPanel from '../post-last-edited-panel';
import { unlock } from '../../lock-unlock';
import TemplateAreas from '../template-areas';

export default function PostCardPanel( { className, actions } ) {
	const { title, showPostContentPanels, icon, postType } = useSelect(
		( select ) => {
			const {
				getEditedPostAttribute,
				getCurrentPostType,
				getCurrentPostId,
				__experimentalGetTemplateInfo,
			} = select( editorStore );
			const { getEditedEntityRecord } = select( coreStore );
			const _type = getCurrentPostType();
			const _id = getCurrentPostId();
			const _record = getEditedEntityRecord( 'postType', _type, _id );
			const _templateInfo =
				[ TEMPLATE_POST_TYPE, TEMPLATE_PART_POST_TYPE ].includes(
					_type
				) && __experimentalGetTemplateInfo( _record );
			return {
				title:
					_templateInfo?.title || getEditedPostAttribute( 'title' ),
				id: _id,
				postType: _type,
				icon: unlock( select( editorStore ) ).getPostIcon( _type, {
					area: _record?.area,
				} ),
				// Post excerpt panel and Last Edited info are rendered in different place depending on the post type.
				// So we cannot make this check inside the PostExcerpt or PostLastEditedPanel component based on the current edited entity.
				showPostContentPanels: [
					TEMPLATE_POST_TYPE,
					TEMPLATE_PART_POST_TYPE,
					PATTERN_POST_TYPE,
				].includes( _type ),
			};
		},
		[]
	);
	return (
		<PanelBody>
			<div
				className={ clsx( 'editor-post-card-panel', className, {
					'has-description': showPostContentPanels,
				} ) }
			>
				<HStack
					spacing={ 2 }
					className="editor-post-card-panel__header"
					align="flex-start"
				>
					<Icon
						className="editor-post-card-panel__icon"
						icon={ icon }
					/>
					<Text
						numberOfLines={ 2 }
						truncate
						className="editor-post-card-panel__title"
						weight={ 500 }
						as="h2"
					>
						{ title ? decodeEntities( title ) : __( 'No Title' ) }
					</Text>
					{ actions }
				</HStack>
				<VStack className="editor-post-card-panel__content">
					{ showPostContentPanels && (
						<VStack
							className="editor-post-card-panel__description"
							spacing={ 2 }
						>
							<PrivatePostExcerptPanel />
							<PostLastEditedPanel />
						</VStack>
					) }
					{ postType === TEMPLATE_POST_TYPE && <TemplateAreas /> }
				</VStack>
			</div>
		</PanelBody>
	);
}
