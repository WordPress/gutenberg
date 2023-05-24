/**
 * WordPress dependencies
 */
import { sprintf, __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	Button,
	VisuallyHidden,
	__experimentalText as Text,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { BlockIcon } from '@wordpress/block-editor';
import { privateApis as commandsPrivateApis } from '@wordpress/commands';
import {
	chevronLeftSmall as chevronLeftSmallIcon,
	sidebar as sidebarIcon,
} from '@wordpress/icons';
import { useEntityRecord } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import useEditedEntityRecord from '../../use-edited-entity-record';
import { unlock } from '../../../private-apis';
import { store as editSiteStore } from '../../../store';

const { store: commandsStore } = unlock( commandsPrivateApis );

export default function DocumentActions() {
	const isPage = useSelect( ( select ) => select( editSiteStore ).isPage() );
	return isPage ? <PageDocumentActions /> : <TemplateDocumentActions />;
}

function PageDocumentActions() {
	const { hasPageContentLock, context } = useSelect(
		( select ) => ( {
			hasPageContentLock: select( editSiteStore ).hasPageContentLock(),
			context: select( editSiteStore ).getEditedPostContext(),
		} ),
		[]
	);

	const { hasResolved, editedRecord } = useEntityRecord(
		'postType',
		context.postType,
		context.postId
	);

	const { togglePageContentLock } = useDispatch( editSiteStore );

	// Return a simple loading indicator until we have information to show.
	if ( ! hasResolved ) {
		return null;
	}

	// Return feedback that the page does not seem to exist.
	if ( ! editedRecord ) {
		return (
			<div className="edit-site-document-actions">
				{ __( 'Document not found' ) }
			</div>
		);
	}

	return hasPageContentLock ? (
		<BaseDocumentActions icon={ sidebarIcon }>
			{ editedRecord.title }
		</BaseDocumentActions>
	) : (
		<TemplateDocumentActions onBack={ () => togglePageContentLock() } />
	);
}

function TemplateDocumentActions( { onBack } ) {
	const { isLoaded, record, getTitle, icon } = useEditedEntityRecord();

	// Return a simple loading indicator until we have information to show.
	if ( ! isLoaded ) {
		return null;
	}

	// Return feedback that the template does not seem to exist.
	if ( ! record ) {
		return (
			<div className="edit-site-document-actions">
				{ __( 'Document not found' ) }
			</div>
		);
	}

	const entityLabel =
		record.type === 'wp_template_part'
			? __( 'template part' )
			: __( 'template' );

	return (
		<BaseDocumentActions icon={ icon } onBack={ onBack }>
			<VisuallyHidden as="span">
				{ sprintf(
					/* translators: %s: the entity being edited, like "template"*/
					__( 'Editing %s: ' ),
					entityLabel
				) }
			</VisuallyHidden>
			{ getTitle() }
		</BaseDocumentActions>
	);
}

function BaseDocumentActions( { icon, children, onBack } ) {
	const { open: openCommandCenter } = useDispatch( commandsStore );
	const isMac = /Mac|iPod|iPhone|iPad/.test( window.navigator.platform );
	return (
		<Button
			className="edit-site-document-actions"
			onClick={ () => openCommandCenter() }
		>
			{ onBack && (
				<Button
					className="edit-site-document-actions__back"
					icon={ chevronLeftSmallIcon }
					onClick={ ( event ) => {
						event.stopPropagation();
						onBack();
					} }
				>
					{ __( 'Back' ) }
				</Button>
			) }
			<HStack
				spacing={ 1 }
				justify="center"
				className="edit-site-document-actions__title"
			>
				<BlockIcon icon={ icon } />
				<Text size="body" as="h1">
					{ children }
				</Text>
			</HStack>
			<span className="edit-site-document-actions__shortcut">
				{ isMac ? '⌘' : 'Ctrl' } K
			</span>
		</Button>
	);
}
