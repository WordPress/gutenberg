/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { Icon } from '@wordpress/components';

function DiscoverBlockInfo( { description } ) {
	return (
		<Fragment>
			<span className="discover-block-info__content">
				{ description }
			</span>
			<div className="discover-block-info-row">
				<div className="discover-block-info-column">
					<Icon icon={ 'chart-line' }></Icon>XX active installations
				</div>
				<div className="discover-block-info-column">
					<Icon icon={ 'update' }></Icon>Updated X week ago.
				</div>
			</div>
		</Fragment>
	);
}

export default DiscoverBlockInfo;
