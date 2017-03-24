/**
 * Internal dependencies
 */
import Inserter from './';

const InserterButton = ( { opened, onClick } ) => {
	const toggle = ( event ) => {
		event.preventDefault();
		onClick();
	};
	return (
		<div className="inserter__button">
			<a href="" className="inserter__button-toggle" onClick={ toggle }>
				<span className="dashicons dashicons-plus" />
			</a>
			{ opened && <Inserter /> }
		</div>
	);
};

export default InserterButton;
