/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { decodeEntities } from '@wordpress/html-entities';
import { Fragment } from '@wordpress/element';
import { Icon, update, chartLine } from '@wordpress/icons';

function DownloadableBlockInfo( {
	activeInstalls,
	description,
	humanizedUpdated,
} ) {
	let activeInstallsString;

	if ( activeInstalls > 1000000 ) {
		activeInstallsString = sprintf(
			/* translators: %d: number of active installations. */
			__( '%d+ Million active installations' ),
			Math.floor( activeInstalls / 1000000 )
		);
	} else if ( 0 === activeInstalls ) {
		activeInstallsString = __( 'Less than 10 active installations' );
	} else {
		activeInstallsString = sprintf(
			/* translators: %d: number of active installations. */
			__( '%d+ active installations' ),
			activeInstalls
		);
	}

	return (
		<Fragment>
			<p className="block-directory-downloadable-block-info__content">
				{ decodeEntities( description ) }
			</p>
			<div className="block-directory-downloadable-block-info__meta">
				<Icon
					className="block-directory-downloadable-block-info__icon"
					icon={ chartLine }
				/>
				{ activeInstallsString }
			</div>
			<div className="block-directory-downloadable-block-info__meta">
				<Icon
					className="block-directory-downloadable-block-info__icon"
					icon={ update }
				/>
				{
					// translators: %s: Humanized date of last update e.g: "2 months ago".
					sprintf( __( 'Updated %s' ), humanizedUpdated )
				}
			</div>
		</Fragment>
	);
}

export default DownloadableBlockInfo;
