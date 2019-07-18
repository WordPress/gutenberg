/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { Icon } from '@wordpress/components';
import { _n, sprintf } from '@wordpress/i18n';

function DiscoverBlockInfo( { description, activeInstalls } ) {
	return (
		<Fragment>
			<span className="block-editor-discover-block-info__content">
				{ description }
			</span>
			<div className="block-editor-discover-block-info__row">
				<div className="block-editor-discover-block-info__column">
					<Icon icon={ 'chart-line' }></Icon>{ sprintf( _n( '%d active installation', '%d active installations', activeInstalls ), activeInstalls ) }
				</div>
				<div className="block-editor-discover-block-info__column">
					<Icon icon={ 'update' }></Icon>Updated X week ago
				</div>
			</div>
		</Fragment>
	);
}

export default DiscoverBlockInfo;
