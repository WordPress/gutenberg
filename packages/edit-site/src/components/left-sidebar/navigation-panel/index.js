/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import {
	__experimentalNavigation as Navigation,
	__experimentalNavigationGroup as NavigationGroup,
	__experimentalNavigationItem as NavigationItem,
	__experimentalNavigationMenu as NavigationMenu,
} from '@wordpress/components';
import { getBlockType, getBlockFromExample } from '@wordpress/blocks';
import { BlockPreview } from '@wordpress/block-editor';

const NavigationPanel = () => {
	const [ showPreview, setShowPreview ] = useState( false );

	return (
		<div className="edit-site-navigation-panel">
			<Navigation>
				<NavigationMenu title="Home">
					<NavigationItem
						item="item-back"
						title="Back to dashboard"
						href="index.php"
					/>

					<NavigationGroup title="Example group">
						<NavigationItem
							item="item-preview"
							title="Hover to show preview"
							onMouseEnter={ () => setShowPreview( true ) }
							onMouseLeave={ () => setShowPreview( false ) }
						/>
					</NavigationGroup>
				</NavigationMenu>
			</Navigation>

			{ showPreview && (
				<div className="edit-site-navigation-panel__preview">
					<BlockPreview
						blocks={ [
							getBlockFromExample(
								'core/paragraph',
								getBlockType( 'core/paragraph' ).example
							),
						] }
						viewportWidth={ 1200 }
					/>
				</div>
			) }
		</div>
	);
};

export default NavigationPanel;
