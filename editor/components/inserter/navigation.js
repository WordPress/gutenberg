/**
 * WordPress dependencies
 */
import { NavigableMenu, Button, IconButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import tabs from './tabs';

function BlockInserterNavigation( { onSelect, onClose } ) {
	return (
		<NavigableMenu className="editor-inserter__navigation" role="menu">
			<div className="editor-inserter__navigation-title">{ __( 'Navigation' ) }</div>
			<IconButton
				className="editor-inserter__navigation-close"
				onClick={ onClose }
				icon="no-alt"
				label={ __( 'Close Navigation Panel' ) }
			/>
			{ tabs.map( ( tab ) => (
				<Button
					key={ tab.name }
					role="menuitem"
					onClick={ () => onSelect( tab.name ) }
					className="editor-inserter__navigation-button"
				>
					{ tab.title }
				</Button>
			) ) }
		</NavigableMenu>
	);
}

export default BlockInserterNavigation;

