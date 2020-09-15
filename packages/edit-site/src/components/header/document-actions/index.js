/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

export default function DocumentActions( {
	primaryText,
	secondaryText,
	isSecondaryItemActive = true,
} ) {
	const hasSecondaryItem = !! secondaryText?.length;
	return (
		<div className="edit-site-document-actions">
			{ primaryText ? (
				<>
					<span
						className={ classnames(
							'edit-site-document-actions__primary-item',
							{
								'is-active': ! hasSecondaryItem,
							}
						) }
					>
						{ primaryText }
					</span>
					{ secondaryText && (
						<span
							className={ classnames(
								'edit-site-document-actions__secondary-item',
								{
									'is-active': isSecondaryItemActive,
								}
							) }
						>
							{ secondaryText }
						</span>
					) }
				</>
			) : (
				__( 'Loading…' )
			) }
		</div>
	);
}
