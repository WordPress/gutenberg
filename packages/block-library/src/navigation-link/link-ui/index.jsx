import { __unstableStripHTML as stripHTML } from '@wordpress/dom';
import { __ } from '@wordpress/i18n';
import {
	privateApis as blockEditorPrivateApis,
	useBlockEditingMode,
} from '@wordpress/block-editor';
import { forwardRef } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import LinkUIBlockInserter from './block-inserter';
import {
	isBlockSuggestion,
	useBlockSuggestions,
	useEntityBinding,
} from '../shared';
import { useLinkPreview } from '../../utils/link-picker';
import { unlock } from '../../lock-unlock';

const { LinkUI: BaseLinkUI } = unlock( blockEditorPrivateApis );

/**
 * The block editor's Link UI set up for a Navigation item: a preview of the
 * linked entity, page creation through core data, and an "Add block" tool.
 *
 * @param {Object} props The props of the Navigation Link UI.
 * @param {Object} ref   Forwarded to the popover.
 */
function UnforwardedLinkUI( props, ref ) {
	const { label, url, opensInNewTab, type, kind, id } = props.link;
	const { entityRecord, hasBinding, isEntityAvailable } = props.entity || {};
	const { clientId } = props;

	const { image, badges } = useLinkPreview( {
		url,
		entityRecord,
		type,
		hasBinding,
		isEntityAvailable,
	} );

	// Use the entity binding hook to get binding status
	const { isBoundEntityAvailable } = useEntityBinding( {
		clientId,
		attributes: props.link,
	} );

	const blockEditingMode = useBlockEditingMode();
	const canAddBlock = blockEditingMode !== 'disabled';
	const canAddPage = useSelect(
		( select ) => {
			if ( ! canAddBlock || type !== 'page' ) {
				return false;
			}

			return !! select( coreStore ).canUser( 'create', {
				kind: 'postType',
				name: 'page',
			} );
		},
		[ canAddBlock, type ]
	);
	const { saveEntityRecord } = useDispatch( coreStore );

	const createPage = async ( { title, publish } ) => {
		const savedRecord = await saveEntityRecord(
			'postType',
			'page',
			{
				title,
				status: publish ? 'publish' : 'draft',
			},
			{ throwOnError: true }
		);

		return {
			id: savedRecord.id,
			type: 'page',
			title: decodeEntities( savedRecord.title.rendered ),
			url: savedRecord.link,
			kind: 'post-type',
		};
	};

	// Blocks are listed in the search results only when the "Add block"
	// button would be shown: the link has no URL yet and the block is not
	// locked.
	const { transformSuggestions, insertBlockFromSuggestion } =
		useBlockSuggestions( {
			clientId,
			isEnabled: canAddBlock && ! url?.length,
			onBlockInsert: props.onBlockInsert,
			onClose: props.onClose,
		} );

	const tools = canAddBlock
		? [
				{
					id: 'block-inserter',
					label: __( 'Add block' ),
					render: ( { onBack } ) => (
						<LinkUIBlockInserter
							clientId={ clientId }
							onBack={ onBack }
							onBlockInsert={ props.onBlockInsert }
						/>
					),
				},
			]
		: [];

	return (
		<BaseLinkUI
			ref={ ref }
			link={ {
				url,
				opensInNewTab,
				title: label && stripHTML( label ),
				entityTitle:
					entityRecord?.title?.rendered || entityRecord?.name,
				kind,
				type,
				id,
				image,
				badges,
			} }
			handleEntities={ isBoundEntityAvailable }
			description={ __(
				'Search for and add a link to your Navigation.'
			) }
			anchor={ props.anchor }
			onClose={ props.onClose }
			onCancel={ props.onCancel }
			onRemove={ props.onRemove }
			onCreatePage={ canAddPage ? createPage : undefined }
			tools={ tools }
			transformSuggestions={ transformSuggestions }
			onChange={ ( updatedValue ) => {
				if ( isBlockSuggestion( updatedValue ) ) {
					insertBlockFromSuggestion( updatedValue.blockItemId );
					return;
				}

				props.onChange( updatedValue );
			} }
		/>
	);
}

export const LinkUI = forwardRef( UnforwardedLinkUI );
