/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { sprintf, __ } from '@wordpress/i18n';
import {
	__experimentalGetBlockLabel as getBlockLabel,
	getBlockType,
} from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import {
	Dropdown,
	Button,
	VisuallyHidden,
	__experimentalText as Text,
} from '@wordpress/components';
import { chevronDown } from '@wordpress/icons';
import { useState, useMemo } from '@wordpress/element';
import {
	store as blockEditorStore,
	useBlockDisplayInformation,
	BlockIcon,
} from '@wordpress/block-editor';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import TemplateDetails from '../../template-details';
import useEditedEntityRecord from '../../use-edited-entity-record';

function getBlockDisplayText( block ) {
	if ( block ) {
		const blockType = getBlockType( block.name );
		return blockType ? getBlockLabel( blockType, block.attributes ) : null;
	}
	return null;
}

function useSecondaryText() {
	const { getBlock } = useSelect( blockEditorStore );
	const activeEntityBlockId = useSelect(
		( select ) =>
			select(
				blockEditorStore
			).__experimentalGetActiveBlockIdByBlockNames( [
				'core/template-part',
			] ),
		[]
	);

	const blockInformation = useBlockDisplayInformation( activeEntityBlockId );

	if ( activeEntityBlockId ) {
		return {
			label: getBlockDisplayText( getBlock( activeEntityBlockId ) ),
			isActive: true,
			icon: blockInformation?.icon,
		};
	}

	return {};
}

export default function DocumentActions() {
	const showIconLabels = useSelect(
		( select ) =>
			select( preferencesStore ).get(
				'core/edit-site',
				'showIconLabels'
			),
		[]
	);
	const { isLoaded, record, getTitle } = useEditedEntityRecord();
	const { label, icon } = useSecondaryText();

	// Use internal state instead of a ref to make sure that the component
	// re-renders when the popover's anchor updates.
	const [ popoverAnchor, setPopoverAnchor ] = useState( null );

	// Memoize popoverProps to avoid returning a new object every time.
	const popoverProps = useMemo(
		() => ( {
			// Use the title wrapper as the popover anchor so that the dropdown is
			// centered over the whole title area rather than just one part of it.
			anchor: popoverAnchor,
			placement: 'bottom',
		} ),
		[ popoverAnchor ]
	);

	// Return a simple loading indicator until we have information to show.
	if ( ! isLoaded ) {
		return (
			<div className="edit-site-document-actions">
				{ __( 'Loading…' ) }
			</div>
		);
	}

	// Return feedback that the template does not seem to exist.
	if ( ! record ) {
		return (
			<div className="edit-site-document-actions">
				{ __( 'Template not found' ) }
			</div>
		);
	}

	const entityLabel =
		record.type === 'wp_template_part'
			? __( 'template part' )
			: __( 'template' );

	return (
		<div
			className={ classnames( 'edit-site-document-actions', {
				'has-secondary-label': !! label,
			} ) }
		>
			<div
				ref={ setPopoverAnchor }
				className="edit-site-document-actions__title-wrapper"
			>
				<Text
					size="body"
					className="edit-site-document-actions__title"
					as="h1"
				>
					<VisuallyHidden as="span">
						{ sprintf(
							/* translators: %s: the entity being edited, like "template"*/
							__( 'Editing %s: ' ),
							entityLabel
						) }
					</VisuallyHidden>
					{ getTitle() }
				</Text>
				<div className="edit-site-document-actions__secondary-item">
					<BlockIcon icon={ icon } showColors />
					<Text size="body">{ label ?? '' }</Text>
				</div>

				<Dropdown
					popoverProps={ popoverProps }
					renderToggle={ ( { isOpen, onToggle } ) => (
						<Button
							className="edit-site-document-actions__get-info"
							icon={ chevronDown }
							aria-expanded={ isOpen }
							aria-haspopup="true"
							onClick={ onToggle }
							variant={ showIconLabels ? 'tertiary' : undefined }
							label={ sprintf(
								/* translators: %s: the entity to see details about, like "template"*/
								__( 'Show %s details' ),
								entityLabel
							) }
						>
							{ showIconLabels && __( 'Details' ) }
						</Button>
					) }
					contentClassName="edit-site-document-actions__info-dropdown"
					renderContent={ ( { onClose } ) => (
						<TemplateDetails
							template={ record }
							onClose={ onClose }
						/>
					) }
				/>
			</div>
		</div>
	);
}
