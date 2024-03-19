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
import { page as pageIcon, navigation, symbol } from '@wordpress/icons';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { humanTimeDiff } from '@wordpress/date';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

const CARD_ICONS = {
	wp_block: symbol,
	wp_navigation: navigation,
};

export default function PostCardPanel( { className, actions, children } ) {
	const { modified, title, type, templateInfo } = useSelect( ( select ) => {
		const {
			getEditedPostAttribute,
			getCurrentPostType,
			getCurrentPostId,
			__experimentalGetTemplateInfo,
		} = select( editorStore );
		const { getEditedEntityRecord } = select( coreStore );
		const _type = getCurrentPostType();
		const _id = getCurrentPostId();
		let _templateInfo;
		if ( _type === 'wp_template' || _type === 'wp_template_part' ) {
			const _record = getEditedEntityRecord( 'postType', _type, _id );
			_templateInfo = __experimentalGetTemplateInfo( _record );
		}
		return {
			title: _templateInfo?.title || getEditedPostAttribute( 'title' ),
			modified: getEditedPostAttribute( 'modified' ),
			id: _id,
			type: _type,
			templateInfo: _templateInfo,
		};
	} );
	const description = templateInfo?.description;
	const lastEditedText =
		modified &&
		sprintf(
			// translators: %s: Human-readable time difference, e.g. "2 days ago".
			__( 'Last edited %s' ),
			humanTimeDiff( modified )
		);
	const icon = CARD_ICONS[ type ] || templateInfo?.icon || pageIcon;
	return (
		<PanelBody>
			<div
				className={ classnames( 'editor-post-card-panel', className ) }
			>
				<HStack
					spacing={ 3 }
					className="editor-post-card-panel__header"
				>
					<Icon
						className="editor-post-card-panel__icon"
						icon={ icon }
					/>
					{ !! title && (
						<h2 className="editor-post-card-panel__title">
							{ decodeEntities( title ) }
						</h2>
					) }
					{ actions }
				</HStack>
				<VStack className="editor-post-card-panel__content">
					{ ( description || lastEditedText ) && (
						<div className="editor-post-card-panel__description">
							<VStack>
								{ !! description && (
									<Text>{ description }</Text>
								) }
								{ !! lastEditedText && (
									<Text>{ lastEditedText }</Text>
								) }
							</VStack>
						</div>
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
