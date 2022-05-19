/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { Button, ToolbarItem } from '@wordpress/components';
import { _x } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { plus } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { useNavigationEditorRootBlock } from '../../hooks';
import { store as editNavigationStore } from '../../store';

function InserterToggle() {
	const { navBlockClientId } = useNavigationEditorRootBlock();

	const { isInserterOpened, hasInserterItems } = useSelect(
		( select ) => {
			return {
				hasInserterItems: select( blockEditorStore ).hasInserterItems(
					navBlockClientId
				),
				isInserterOpened: select(
					editNavigationStore
				).isInserterOpened(),
			};
		},
		[ navBlockClientId ]
	);

	const { setIsInserterOpened } = useDispatch( editNavigationStore );

	return (
		<ToolbarItem
			as={ Button }
			className="edit-navigation-header-inserter-toggle"
			variant="primary"
			isPressed={ isInserterOpened }
			onMouseDown={ ( event ) => {
				event.preventDefault();
			} }
			onClick={ () => setIsInserterOpened( ! isInserterOpened ) }
			icon={ plus }
			/* translators: button label text should, if possible, be under 16
					characters. */
			label={ _x(
				'Toggle block inserter',
				'Generic label for block inserter button'
			) }
			disabled={ ! hasInserterItems }
		/>
	);
}

export default InserterToggle;
