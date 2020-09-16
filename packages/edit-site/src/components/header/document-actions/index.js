/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Button, Dropdown } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	__experimentalGetBlockLabel as getBlockLabel,
	getBlockType,
} from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { DOWN } from '@wordpress/keycodes';

function useSecondaryText() {
	const selectedBlock = useSelect( ( select ) => {
		return select( 'core/block-editor' ).getSelectedBlock();
	} );

	// TODO: Handle if parent is template part too.
	const selectedBlockLabel =
		selectedBlock?.name === 'core/template-part'
			? getBlockLabel(
					getBlockType( selectedBlock?.name ),
					selectedBlock?.attributes
			  )
			: null;

	if ( selectedBlockLabel ) {
		return {
			label: selectedBlockLabel,
			isActive: true,
		};
	}
	return {};
}

export default function DocumentActions( { documentTitle } ) {
	const { label, isActive } = useSecondaryText();
	// Title is active when there is no secondary item, or when the secondary
	// item is inactive.
	const isTitleActive = ! label?.length || ! isActive;

	return (
		<div
			className={ classnames( 'edit-site-document-actions', {
				'has-secondary-label': !! label,
			} ) }
		>
			{ documentTitle ? (
				<>
					<Dropdown
						position="bottom center"
						renderToggle={ ( { onToggle, isOpen } ) => {
							const openOnArrowDown = ( event ) => {
								if ( ! isOpen && event.keyCode === DOWN ) {
									event.preventDefault();
									event.stopPropagation();
									onToggle();
								}
							};
							{
								/* TODO: Fix vertical text padding */
							}
							return (
								<Button
									onClick={ onToggle }
									className={ classnames(
										'edit-site-document-actions__label',
										'edit-site-document-actions__title',
										{
											'is-active': isTitleActive,
										}
									) }
									aria-haspopup="true"
									aria-expanded={ isOpen }
									onKeyDown={ openOnArrowDown }
									label={ __( 'Change document settings.' ) }
									showTooltip
								>
									{ documentTitle }
								</Button>
							);
						} }
						renderContent={ () => (
							<div
								style={ {
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
								} }
							>
								{ /* TODO: Replace inline styles */ }
								<span style={ { marginRight: '12px' } }>
									URL
								</span>
								{ /* TODO: Don't allow input when there is no page context */ }
								<input
									placeholder={ 'nice' }
									style={ { width: '100%' } }
								/>
							</div>
						) }
					></Dropdown>
					<div
						className={ classnames(
							'edit-site-document-actions__label',
							'edit-site-document-actions__secondary-item',
							{
								'is-active': isActive,
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
