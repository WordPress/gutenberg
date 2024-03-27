/**
 * External dependencies
 */
import classnames from 'classnames';

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
import { __, sprintf } from '@wordpress/i18n';
import { humanTimeDiff } from '@wordpress/date';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

export default function PostCardPanel( { className, actions, children } ) {
	const { modified, title, templateInfo, icon } = useSelect( ( select ) => {
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
		const _templateInfo = __experimentalGetTemplateInfo( _record );
		return {
			title: _templateInfo?.title || getEditedPostAttribute( 'title' ),
			modified: getEditedPostAttribute( 'modified' ),
			id: _id,
			templateInfo: _templateInfo,
			icon: unlock( select( editorStore ) ).getPostIcon( _type, {
				area: _record?.area,
			} ),
		};
	} );
	const description = templateInfo?.description;
	const lastEditedText =
		modified &&
		sprintf(
			// translators: %s: Human-readable time difference, e.g. "2 days ago".
			__( 'Last edited %s.' ),
			humanTimeDiff( modified )
		);

	return (
		<PanelBody>
			<div
				className={ classnames( 'editor-post-card-panel', className ) }
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
					{ ( description || lastEditedText ) && (
						<VStack
							className="editor-post-card-panel__description"
							spacing={ 2 }
						>
							{ description && <Text>{ description }</Text> }
							{ lastEditedText && (
								<Text>{ lastEditedText }</Text>
							) }
						</VStack>
					) }
					{
						// Todo: move TemplateAreas (and the selectors it depends) to the editor package, and use it here removing the children prop.
						children
					}
				</VStack>
			</div>
		</PanelBody>
	);
}
