/**
 * WordPress dependencies
 */
import { NavigableMenu, Button, IconButton, withFocusReturn } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import tabs from './tabs';

const onFocus = ( event ) => {
	if ( event.target.getAttribute( 'role' ) !== 'tablist' ) {
		return;
	}
	event.target.querySelector( '[role="tab"]' ).focus();
};

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
			<NavigableMenu role="tablist" aria-orientation="vertical" tabIndex={ selected ? '-1' : '0' } onFocus={ onFocus }>
				{ tabs.map( ( tab ) => (
					<Button
						key={ tab.name }
						role="tab"
						onFocus={ () => onSelect( tab.name ) }
						className="editor-inserter__navigation-button"
						isToggled={ selected === tab.name }
						aria-selected={ selected === tab.name }
						aria-controls={ ariaControlsPrefix + '-' + tab.name }
						tabIndex={ selected === tab.name ? undefined : '-1' }
					>
						{ tab.title }
					</Button>
				) ) }
			</NavigableMenu>
		</div>
	);
}

export default withFocusReturn( BlockInserterNavigation );

