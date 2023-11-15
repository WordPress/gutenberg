/**
 * WordPress dependencies
 */
import { Dropdown, ColorPicker, Button } from '@wordpress/components';

export default function CustomColor( { color, onSelect } ) {
	return (
		<Dropdown
			className="my-container-class-name"
			contentClassName="my-dropdown-content-classname"
			popoverProps={ { placement: 'bottom-start' } }
			renderToggle={ ( { isOpen, onToggle } ) => (
				<Button
					style={ {
						height: 'calc(100% - 3px)',
						margin: '1.5px',
						width: 'calc(100% - 3px)',
						textAlign: 'center',
						display: 'block',
						backgroundColor: color,
						color: 'white',
					} }
					variant="tertiary"
					onClick={ onToggle }
					aria-expanded={ isOpen }
				>
					Custom
				</Button>
			) }
			renderContent={ () => <ColorPicker onChange={ onSelect } /> }
		/>
	);
}
