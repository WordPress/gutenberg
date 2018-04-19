/**
 * WordPress dependencies
 */
import { NavigableMenu, Button, IconButton, withFocusReturn } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import tabs from './tabs';

function BlockInserterNavigation( { ariaControlsPrefix, selected, onSelect, onClose } ) {
	return (
		<div className="editor-inserter__navigation">
			<div className="editor-inserter__navigation-title">{ __( 'Navigation' ) }</div>
			<IconButton
				className="editor-inserter__navigation-close"
				onClick={ onClose }
				icon="no-alt"
				label={ __( 'Close Navigation Panel' ) }
			/>
			<NavigableMenu role="tablist" aria-orientation="vertical">
				{ tabs.map( ( tab ) => (
					<Button
						key={ tab.name }
						role="tab"
						onClick={ () => onSelect( tab.name ) }
						className="editor-inserter__navigation-button"
						aria-selected={ selected === tab.name }
						aria-controls={ ariaControlsPrefix + '-' + tab.name }
					>
						{ tab.title }
					</Button>
				) ) }
			</NavigableMenu>
		</div>
	);
}

export default withFocusReturn( BlockInserterNavigation );

