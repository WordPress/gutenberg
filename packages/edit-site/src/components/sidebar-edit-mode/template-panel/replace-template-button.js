/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useMemo, useState, useCallback } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __experimentalBlockPatternsList as BlockPatternsList } from '@wordpress/block-editor';
import { MenuItem, Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useEntityRecord } from '@wordpress/core-data';
import { parse } from '@wordpress/blocks';
import { useAsyncList } from '@wordpress/compose';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../../store';
import { useAvailableTemplates } from '../page-panels/hooks';
import { unlock } from '../../../lock-unlock';
import { PATTERN_CORE_SOURCES, PATTERN_TYPES } from '../../../utils/constants';

// This is duplicated.
const filterOutDuplicatesByName = ( currentItem, index, items ) =>
	index === items.findIndex( ( item ) => currentItem.name === item.name );

const selectAvailablePatterns = ( select ) => {
	const { getSettings } = unlock( select( editSiteStore ) );
	const settings = getSettings();
	const blockPatterns =
		settings.__experimentalAdditionalBlockPatterns ??
		settings.__experimentalBlockPatterns;

	const restBlockPatterns = select( coreStore ).getBlockPatterns();

	const patterns = [
		...( blockPatterns || [] ),
		...( restBlockPatterns || [] ),
	]
		.filter(
			( pattern ) => ! PATTERN_CORE_SOURCES.includes( pattern.source )
		)
		.filter( filterOutDuplicatesByName )
		.filter( ( pattern ) => pattern.templateTypes?.includes( 'home' ) )
		.map( ( pattern ) => ( {
			...pattern,
			keywords: pattern.keywords || [],
			type: PATTERN_TYPES.theme,
			blocks: parse( pattern.content, {
				__unstableSkipMigrationLogs: true,
			} ),
		} ) );

	return patterns;
};

export default function ReplaceTemplateButton( { onClick } ) {
	const [ showModal, setShowModal ] = useState( false );
	//const availableTemplates = useAvailableTemplates();
	const onClose = useCallback( () => {
		setShowModal( false );
	}, [] );

	const { postId, postType } = useSelect( ( select ) => {
		return {
			postId: select( editSiteStore ).getEditedPostId(),
			postType: select( editSiteStore ).getEditedPostType(),
		};
	}, [] );

	// Should we also get templates?

	//console.log( selectThemePatterns );
	const entitiy = useEntityRecord( 'postType', postType, postId );
	console.log( 'entitiy', entitiy );

	const availableTemplates = useSelect( selectAvailablePatterns );
	console.log( availableTemplates );
	//const { setPage } = useDispatch( editSiteStore );
	if ( ! availableTemplates?.length ) {
		return null;
	}
	const onTemplateSelect = async ( template ) => {
		const templateObjectItself = availableTemplates.find(
			( availableTemplate ) => availableTemplate.name === template.id
		);
		console.log( templateObjectItself.content );

		entitiy.edit( { content: templateObjectItself.content } );
		// TODO - work out how to save the template.
		//	await setPage( {
		//		context: { postType, postId },
		//	} );
		onClose(); // Close the template suggestions modal first.
		onClick();
	};
	return (
		<>
			<MenuItem
				info={ __(
					'Replace this template entirely with another like it.'
				) }
				onClick={ () => setShowModal( true ) }
			>
				{ __( 'Replace template' ) }
			</MenuItem>

			{ showModal && (
				<Modal
					title={ __( 'Choose a template' ) }
					onRequestClose={ onClose }
					overlayClassName="edit-site-template-panel__replace-template-modal"
					isFullScreen
				>
					<div className="edit-site-template-panel__replace-template-modal__content">
						<TemplatesList onSelect={ onTemplateSelect } />
					</div>
				</Modal>
			) }
		</>
	);
}

function TemplatesList( { onSelect } ) {
	//const availableTemplates = useAvailableTemplates();
	const availableTemplates = useSelect( selectAvailablePatterns );
	const templatesAsPatterns = useMemo(
		() =>
			availableTemplates.map( ( template ) => {
				return {
					name: template.name,
					blocks: template.blocks,
					title: template.title,
					id: template.name,
				};
			} ),
		[ availableTemplates ]
	);
	const shownTemplates = useAsyncList( templatesAsPatterns );

	// TODO - make this use a grid layout.
	return (
		<BlockPatternsList
			label={ __( 'Templates' ) }
			blockPatterns={ templatesAsPatterns }
			shownPatterns={ shownTemplates }
			onClickPattern={ onSelect }
		/>
	);
}
