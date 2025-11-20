import {
	Button,
	Popover,
	Icon,
	DropdownMenu,
	IconButton,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { chevronDown, pencil, seen } from '@wordpress/icons';

const MODES = [
	{
		value: 'edit',
		label: __( 'Editing', 'gutenberg' ),
		description: __( 'Edit document directly', 'gutenberg' ),
		icon: pencil,
	},
	{
		value: 'view',
		label: __( 'Viewing', 'gutenberg' ),
		description: __( 'Focus on content', 'gutenberg' ),
		icon: seen,
	},
];

/**
 * CollaborationModePicker component that allows users to switch between View and Edit modes.
 * Displays the currently selected mode icon in the toolbar and opens a popover to select a different mode.
 */
export function EditorMode() {
	const [ isPopoverVisible, setIsPopoverVisible ] = useState( false );
	const [ popoverAnchor, setPopoverAnchor ] = useState( null );
	const [ selectedMode, setSelectedMode ] = useState( 'edit' );

	// ToDo: Read this from the store instead.
	//const selectedMode = 'edit';

	const currentMode = MODES.find( ( mode ) => mode.value === selectedMode );

	const handleModeSelect = ( mode ) => {
		setSelectedMode( mode );
		setIsPopoverVisible( false );
	};

	return (
		<>
			<Button
				className="editor-mode-button"
				aria-label={ `Editor mode: ${ currentMode?.label }` }
				onClick={ () => setIsPopoverVisible( ! isPopoverVisible ) }
				isPressed={ isPopoverVisible }
				size="compact"
				ref={ setPopoverAnchor }
				text={ currentMode?.label }
				icon={ currentMode?.icon }
			>
				<Icon icon={ chevronDown } />
			</Button>
			{ isPopoverVisible && (
				<Popover
					anchor={ popoverAnchor }
					placement="bottom-start"
					offset={ 10 }
					className="editor-mode-popover"
					onClose={ () => setIsPopoverVisible( false ) }
				>
					<div className="editor-mode-menu">
						{ MODES.map(
							( { value, label, description, icon } ) => {
								const isSelected = value === selectedMode;
								return (
									<button
										key={ value }
										className={ `editor-mode-menu-item ${
											isSelected ? 'is-selected' : ''
										}` }
										onClick={ () =>
											handleModeSelect( value )
										}
										aria-pressed={ isSelected }
									>
										<div className="editor-menu-item-content">
											<div className="editor-menu-item-icon">
												<Icon
													icon={ icon }
													size={ 24 }
												/>
											</div>
											<div className="editor-menu-item-label">
												<div className="editor-menu-item-title">
													{ label }
												</div>
												<div className="editor-menu-item-description">
													{ description }
												</div>
											</div>
										</div>
									</button>
								);
							}
						) }
					</div>
				</Popover>
			) }
		</>
	);
}

export default EditorMode;
