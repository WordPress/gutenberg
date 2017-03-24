/**
 * Internal dependencies
 */
import Inserter from './';

const el = wp.element.createElement;

const InserterButton = ( { opened, onClick } ) => {
	return el( 'div', { className: 'inserter__button' },
		el( 'a', { className: 'inserter__button-toggle', onClick },
			el( 'span', { className: 'dashicons dashicons-plus' } )
		),
		opened && el( Inserter )
	);
};

export default InserterButton;
