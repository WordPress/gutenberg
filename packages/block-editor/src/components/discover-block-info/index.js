/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { Icon } from '@wordpress/components';

function DiscoverBlockInfo( { description } ) {
	return (
		<Fragment>
			<span className="block-editor-discover-block-info__content">
				{ description }
			</span>
			<div className="block-editor-discover-block-info__row">
				<div className="block-editor-discover-block-info__column">
					<Icon icon={ 'chart-line' }></Icon>XX active installations
				</div>
				<div className="block-editor-discover-block-info__column">
					<Icon icon={ 'update' }></Icon>Updated X week ago
				</div>
			</div>
		</Fragment>
	);
}

export default DiscoverBlockInfo;
