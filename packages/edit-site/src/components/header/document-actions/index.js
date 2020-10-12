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
import { Dropdown, Button, VisuallyHidden } from '@wordpress/components';
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
 * @param {Object[]} props.children    React component to use for the
 *                                     information dropdown area.
 */
export default function DocumentActions( {
	entityTitle,
	entityLabel,
	children: dropdownContent,
} ) {
	const { label, isActive } = useSecondaryText();

	// Title is active when there is no secondary item, or when the secondary
	// item is inactive.
	const isTitleActive = ! label?.length || ! isActive;

	// The title ref is passed to the popover as the anchorRef so that the
	// dropdown is centered over the whole title area rather than just one
	// part of it.
	const titleRef = useRef();

	return (
		<div
			className={ classnames( 'edit-site-document-actions', {
				'has-secondary-label': !! label,
			} ) }
		>
			{ entityTitle ? (
				<>
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
							<div
								className={ classnames(
									'edit-site-document-actions__title',
									{
										'is-active': isTitleActive,
										'is-secondary-title-active': isActive,
									}
								) }
							>
								{ entityTitle }
							</div>
						</h1>
						{ dropdownContent && ! isActive && (
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
								renderContent={ () => dropdownContent }
							/>
						) }
					</div>

					<div
						className={ classnames(
							'edit-site-document-actions__secondary-item',
							{
								'is-secondary-title-active': isActive,
							}
						) }
					>
						{ label ?? '' }
					</div>
				</>
			) : (
				__( 'Loading…' )
			) }
		</div>
	);
}
