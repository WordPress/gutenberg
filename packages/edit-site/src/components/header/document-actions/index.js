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
import { useRef } from '@wordpress/element';
import { store as blockEditorStore } from '@wordpress/block-editor';

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

	if ( activeEntityBlockId ) {
		return {
			label: getBlockDisplayText( getBlock( activeEntityBlockId ) ),
			isActive: true,
		};
	}

	return {};
}

/**
 * @param {Object}   props             Props for the DocumentActions component.
 * @param {string}   props.entityTitle The title to display.
 * @param {string}   props.entityLabel A label to use for entity-related options.
 *                                     E.g. "template" would be used for "edit
 *                                     template" and "show template details".
 * @param {boolean}  props.isLoaded    Whether the data is available.
 * @param {Function} props.children    React component to use for the
 *                                     information dropdown area. Should be a
 *                                     function which accepts dropdown props.
 */
export default function DocumentActions( {
	entityTitle,
	entityLabel,
	isLoaded,
	children: dropdownContent,
} ) {
	const { label } = useSecondaryText();

	// The title ref is passed to the popover as the anchorRef so that the
	// dropdown is centered over the whole title area rather than just one
	// part of it.
	const titleRef = useRef();

	// Return a simple loading indicator until we have information to show.
	if ( ! isLoaded ) {
		return (
			<div className="edit-site-document-actions">
				{ __( 'Loading…' ) }
			</div>
		);
	}

	// Return feedback that the template does not seem to exist.
	if ( ! entityTitle ) {
		return (
			<div className="edit-site-document-actions">
				{ __( 'Template not found' ) }
			</div>
		);
	}

	return (
		<div
			className={ classnames( 'edit-site-document-actions', {
				'has-secondary-label': !! label,
			} ) }
		>
			<div
				ref={ titleRef }
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
					{ entityTitle }
				</Text>

				<Text
					size="body"
					className="edit-site-document-actions__secondary-item"
				>
					{ label ?? '' }
				</Text>

				{ dropdownContent && (
					<Dropdown
						popoverProps={ {
							anchorRef: titleRef.current,
						} }
						position="bottom center"
						renderToggle={ ( { isOpen, onToggle } ) => (
							<Button
								className="edit-site-document-actions__get-info"
								icon={ chevronDown }
								aria-expanded={ isOpen }
								aria-haspopup="true"
								onClick={ onToggle }
								label={ sprintf(
									/* translators: %s: the entity to see details about, like "template"*/
									__( 'Show %s details' ),
									entityLabel
								) }
							/>
						) }
						contentClassName="edit-site-document-actions__info-dropdown"
						renderContent={ dropdownContent }
					/>
				) }
			</div>
		</div>
	);
}
