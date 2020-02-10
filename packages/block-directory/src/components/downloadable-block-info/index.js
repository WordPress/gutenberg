/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { Icon } from '@wordpress/components';
import { __, _n, sprintf } from '@wordpress/i18n';
import { update } from '@wordpress/icons';

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
			<div className="block-directory-downloadable-block-info__row">
				<div className="block-directory-downloadable-block-info__column">
					<Icon icon="chart-line"></Icon>
					{ sprintf(
						_n(
							'%d active installation',
							'%d active installations',
							activeInstalls
						),
						activeInstalls
					) }
				</div>
				<div className="block-directory-downloadable-block-info__column">
					<Icon icon={ update }></Icon>
					{ // translators: %s: Humanized date of last update e.g: "2 months ago".
					sprintf( __( 'Updated %s' ), humanizedUpdated ) }
				</div>
			</div>
		</Fragment>
	);
}

export default DownloadableBlockInfo;
