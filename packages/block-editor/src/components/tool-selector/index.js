/**
 * WordPress dependencies
 */
import {
	Dropdown,
	Button,
	MenuItemsChoice,
	SVG,
	Path,
	NavigableMenu,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, forwardRef } from '@wordpress/element';
import { Icon, edit as editIcon, link as linkIcon } from '@wordpress/icons';

const selectIcon = (
	<SVG
		xmlns="http://www.w3.org/2000/svg"
		width="24"
		height="24"
		viewBox="0 0 24 24"
	>
		<Path d="M9.4 20.5L5.2 3.8l14.6 9-2 .3c-.2 0-.4.1-.7.1-.9.2-1.6.3-2.2.5-.8.3-1.4.5-1.8.8-.4.3-.8.8-1.3 1.5-.4.5-.8 1.2-1.2 2l-.3.6-.9 1.9zM7.6 7.1l2.4 9.3c.2-.4.5-.8.7-1.1.6-.8 1.1-1.4 1.6-1.8.5-.4 1.3-.8 2.2-1.1l1.2-.3-8.1-5z" />
	</SVG>
);

function ToolSelector( props, ref ) {
	const { isNavigationMode, enableFullSiteEditing } = useSelect(
		( select ) => {
			const { isNavigationMode: _isNavigationMode, getSettings } = select(
				'core/block-editor'
			);
			return {
				isNavigationMode: _isNavigationMode(),
				enableFullSiteEditing: getSettings()
					.__experimentalEnableFullSiteEditing,
			};
		},
		[]
	);
	const { setNavigationMode, setBrowseMode } = useDispatch(
		'core/block-editor'
	);

	const [ tool, setTool ] = useState( isNavigationMode ? 'select' : 'edit' );

	const onSwitchMode = ( mode ) => {
		setNavigationMode( mode === 'edit' ? false : true );
		setBrowseMode( mode === 'browse' ? false : true );
		setTool( mode );
	};
	return (
		<Dropdown
			renderToggle={ ( { isOpen, onToggle } ) => (
				<Button
					{ ...props }
					ref={ ref }
					icon={
						{
							edit: editIcon,
							select: selectIcon,
							browse: linkIcon,
						}[ tool ]
					}
					aria-expanded={ isOpen }
					onClick={ onToggle }
					label={ __( 'Tools' ) }
				/>
			) }
			position="bottom right"
			renderContent={ () => (
				<>
					<NavigableMenu role="menu" aria-label={ __( 'Tools' ) }>
						<MenuItemsChoice
							value={ tool }
							onSelect={ onSwitchMode }
							choices={ [
								{
									value: 'edit',
									label: (
										<>
											<Icon icon={ editIcon } />
											{ __( 'Edit' ) }
										</>
									),
								},
								{
									value: 'select',
									label: (
										<>
											{ selectIcon }
											{ __( 'Select' ) }
										</>
									),
								},
								enableFullSiteEditing && {
									value: 'browse',
									label: (
										<>
											<Icon icon={ linkIcon } />
											{ __( 'Browse' ) }
										</>
									),
								},
							].filter( Boolean ) }
						/>
					</NavigableMenu>
					<div className="block-editor-tool-selector__help">
						{ __(
							'Tools offer different interactions for block selection & editing. To select, press Escape, to go back to editing, press Enter.'
						) }
					</div>
				</>
			) }
		/>
	);
}

export default forwardRef( ToolSelector );
