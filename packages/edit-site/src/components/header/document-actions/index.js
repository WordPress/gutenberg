/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Button, Dropdown } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { DOWN } from '@wordpress/keycodes';

export default function DocumentActions( {
	primaryText,
	secondaryText,
	isSecondaryItemActive = false,
} ) {
	return (
		<div className="edit-site-document-actions">
			{ primaryText ? (
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
						return (
							<Button
								onClick={ onToggle }
								className="edit-site-document-actions__document_root"
								aria-haspopup="true"
								aria-expanded={ isOpen }
								onKeyDown={ openOnArrowDown }
								label={ __( 'Change document settings.' ) }
								showTooltip
							>
								<span> { primaryText } </span>
								{ secondaryText && (
									<>
										<span className="edit-site-document-actions__separator">
											:{ ' ' }
										</span>
										<span
											className={ classnames(
												'edit-site-document-actions__document_item',
												{
													'is-active':
														isSecondaryItemActive ||
														isOpen,
												}
											) }
										>
											{ secondaryText }
										</span>
									</>
								) }
							</Button>
						);
					} }
					renderContent={ () => <div>TODO: Document Settings</div> }
				/>
			) : (
				__( 'Loading…' )
			) }
		</div>
	);
}
