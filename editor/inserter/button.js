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
			<button
				className="inserter__button-toggle"
				onClick={ toggle }
				aria-label="Add a block"
			>
				<span className="dashicons dashicons-plus" />
			</button>
			{ opened && <Inserter /> }
		</div>
	);
};

export default InserterButton;
