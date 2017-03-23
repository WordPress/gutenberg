import Inserter from './';

const h = wp.element.createElement;

const InserterButton = ( { opened, onClick } ) => {
	return h( 'div', { className: 'inserter__button' },
		h( 'a', { onClick },
			h( 'span', { className: 'dashicons dashicons-plus' } )
		),
		opened && h( Inserter )
	);
};

export default InserterButton;
