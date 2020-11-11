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

function getBlockDisplayText( block ) {
	return block
		? getBlockLabel( getBlockType( block.name ), block.attributes )
		: null;
}

function useSecondaryText() {
	const { activeEntityBlockId, getBlock } = useSelect( ( select ) => {
		return {
			activeEntityBlockId: select(
				'core/block-editor'
			).__experimentalGetActiveBlockIdByBlockNames( [
				'core/template-part',
			] ),
			getBlock: select( 'core/block-editor' ).getBlock,
		};
	} );

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
 * @param {Function} props.children    React component to use for the
 *                                     information dropdown area. Should be a
 *                                     function which accepts dropdown props.
 */
export default function DocumentActions( {
	entityTitle,
	entityLabel,
	children: dropdownContent,
} ) {
	const { label } = useSecondaryText();

	// The title ref is passed to the popover as the anchorRef so that the
	// dropdown is centered over the whole title area rather than just one
	// part of it.
	const titleRef = useRef();

	// Return a simple loading indicator until we have information to show.
	if ( ! entityTitle ) {
		return (
			<div className="edit-site-document-actions">
				{ __( 'Loading…' ) }
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
				<h1>
					<VisuallyHidden>
						{ sprintf(
							/* translators: %s: the entity being edited, like "template"*/
							__( 'Edit %s:' ),
							entityLabel
						) }
					</VisuallyHidden>
					<Text
						variant="subtitle.small"
						className="edit-site-document-actions__title"
					>
						{ entityTitle }
					</Text>
				</h1>
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
			<Text
				variant="body"
				className="edit-site-document-actions__secondary-item"
			>
				{ label ?? '' }
			</Text>
		</div>
	);
}
