/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import IconButton from '../icon-button';
import './style.scss';

function ChoiceMenu( { label, value, choices, onSelect } ) {
	return (
		<div className="components-choice-menu">
			<div className="components-choice-menu__label">{ label }</div>
			{ choices.map( ( item ) => {
				const className = classnames( 'components-choice-menu__item', {
					'is-selected': value === item.value,
				} );
				return (
					<IconButton
						key={ item.value }
						className={ className }
						icon={ item.icon }
						onClick={ () => onSelect( item.value ) }
					>
						{ item.label }
					</IconButton>
				);
			} ) }
		</div>
	);
}

export default ChoiceMenu;
