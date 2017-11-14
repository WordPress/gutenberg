/**
 * Internal dependencies
 */
import IconButton from '../icon-button';
import Button from '../button';
import './style.scss';

function ChoiceMenu( { label, value, choices, onSelect } ) {
	return (
		<div className="components-choice-menu">
			<div className="components-choice-menu__label">{ label }</div>
			{ choices.map( ( item ) => {
				const isSelected = value === item.value;
				if ( isSelected ) {
					return (
						<IconButton
							key={ item.value }
							className="components-choice-menu__item is-selected"
							icon="yes"
						>
							{ item.label }
						</IconButton>
					);
				}

				return (
					<Button
						key={ item.value }
						className="components-choice-menu__item"
						onClick={ () => onSelect( item.value ) }
					>
						{ item.label }
					</Button>
				);
			} ) }
		</div>
	);
}

export default ChoiceMenu;
