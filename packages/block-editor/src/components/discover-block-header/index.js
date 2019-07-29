/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';
import { withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';
import BlockRatings from '../block-ratings';

function DiscoverBlockHeader( { slug, icon, title, rating, ratingCount, onClick, installBlock, removeNotice } ) {
	const retryIfFailed = () => {
		removeNotice( 'block-install-error' );
		installBlock( slug, retryIfFailed, removeIfFailed );
	};

	const removeIfFailed = () => {
		removeNotice( 'block-install-error' );
		//TODO: remove block and unregister block type from editor;
	};

	return (
		<Fragment>
			<div className="block-editor-discover-block-header__row">
				{
					icon.match( /\.(jpeg|jpg|gif|png)/ ) !== null ?
						<img src={ icon } alt="block icon" /> :
						<span >
							<BlockIcon icon={ icon } showColors />
						</span>
				}

				<div className="block-editor-discover-block-header__column">
					<span className="block-editor-discover-block-header__title">
						{ title }
					</span>
					<BlockRatings rating={ rating } ratingCount={ ratingCount } />
				</div>
				<Button
					isDefault
					onClick={ ( event ) => {
						event.preventDefault();
						installBlock( slug, retryIfFailed, removeIfFailed );
						onClick();
					} }
				>
					{ __( 'Add' ) }
				</Button>
			</div>
		</Fragment>
	);
}

export default compose(
	withDispatch( ( dispatch ) => {
		const { installBlock } = dispatch( 'core/block-editor' );
		const { removeNotice } = dispatch( 'core/notices' );

		return {
			installBlock: ( slug, retry, remove ) => installBlock( slug, retry, remove ),
			removeNotice: ( id ) => removeNotice( id ),
		};
	} ),
)( DiscoverBlockHeader );
