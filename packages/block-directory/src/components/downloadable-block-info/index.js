/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Icon, update, chartLine } from '@wordpress/icons';

function DownloadableBlockInfo( {
	description,
	activeInstalls,
	humanizedUpdated,
} ) {
	return (
		<Fragment>
			<p className="block-directory-downloadable-block-info__content">
				{ description }
			</p>
			<div className="block-directory-downloadable-block-info__meta">
				<Icon
					className="block-directory-downloadable-block-info__icon"
					icon={ chartLine }
				/>
				{ sprintf(
					/* translators: %s: number of active installations. */
					_n(
						'%d active installation',
						'%d active installations',
						activeInstalls
					),
					activeInstalls
				) }
			</div>
			<div className="block-directory-downloadable-block-info__meta">
				<Icon
					className="block-directory-downloadable-block-info__icon"
					icon={ update }
				/>
				{ // translators: %s: Humanized date of last update e.g: "2 months ago".
				sprintf( __( 'Updated %s' ), humanizedUpdated ) }
			</div>
		</Fragment>
	);
}

export default DownloadableBlockInfo;
