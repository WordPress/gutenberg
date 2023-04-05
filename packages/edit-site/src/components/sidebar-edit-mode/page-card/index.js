/**
 * WordPress dependencies
 */
import {
	Icon,
	PanelBody,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	Button,
} from '@wordpress/components';
import {
	page as pageIcon,
	title as titleIcon,
	postExcerpt as postExcerptIcon,
	postContent as postContentIcon,
	postFeaturedImage as postFeaturedImageIcon,
} from '@wordpress/icons';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEntityRecord } from '@wordpress/core-data';
import { humanTimeDiff } from '@wordpress/date';
import { __, sprintf } from '@wordpress/i18n';
import { BlockContextProvider, BlockPreview } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../../store';
import useEditedEntityRecord from '../../use-edited-entity-record';

export default function PageCard() {
	const blockContext = useSelect(
		( select ) => select( editSiteStore ).getEditedPostContext(),
		[]
	);
	const { postType, postId, ...filteredBlockContext } = blockContext;
	const { hasResolved: hasPostResolved, editedRecord: post } =
		useEntityRecord( 'postType', postType, postId );
	const {
		isLoaded: isTemplateLoaded,
		getTitle: getTemplateTitle,
		record: template,
	} = useEditedEntityRecord();

	const { setEditFocus } = useDispatch( editSiteStore );

	if ( ! hasPostResolved && ! isTemplateLoaded ) {
		return;
	}

	return (
		<>
			<PanelBody>
				<div className="edit-site-template-card">
					<Icon
						className="edit-site-template-card__icon"
						icon={ pageIcon }
					/>
					<div className="edit-site-template-card__content">
						<div className="edit-site-template-card__header">
							<h2 className="edit-site-template-card__title">
								{ post.title }
							</h2>
						</div>
						<div
							className="edit-site-template-card__description"
							style={ { margin: 'unset' } }
						>
							{ sprintf(
								// translators: %s: Human-readable time difference, e.g. "2 days ago".
								__( 'Last edited %s' ),
								humanTimeDiff( post.modified )
							) }
						</div>
					</div>
				</div>
			</PanelBody>
			<PanelBody title={ __( 'Content' ) }>
				<VStack>
					{ /* TODO: make this dynamic */ }
					<Button icon={ titleIcon }>Page Title</Button>
					<Button icon={ postExcerptIcon }>Page Excerpt</Button>
					<Button icon={ postContentIcon }>Page Content</Button>
					<Button icon={ postFeaturedImageIcon }>
						Featured Image
					</Button>
				</VStack>
			</PanelBody>
			<PanelBody title={ __( 'Template' ) }>
				<VStack>
					<HStack>
						<div>{ getTemplateTitle() }</div>
						{ /* TODO: REST API doesn't readily have this information */ }
						<div style={ { color: '#949494' } }>
							Used on 4 pages
						</div>
					</HStack>
					<div
						style={ {
							border: '1px solid #e0e0e0',
							maxHeight: 200,
							overflow: 'hidden',
						} }
					>
						{ /* TODO: not sure why this doesn't work. it should stop the preview from showing page content */ }
						<BlockContextProvider value={ filteredBlockContext }>
							<BlockPreview
								viewportWidth={ 1024 }
								blocks={ template.blocks }
							/>
						</BlockContextProvider>
					</div>
					<Button
						variant="secondary"
						style={ { justifyContent: 'center' } }
						onClick={ () => setEditFocus( 'template' ) }
					>
						{ __( 'Edit template' ) }
					</Button>
				</VStack>
			</PanelBody>
		</>
	);
}
