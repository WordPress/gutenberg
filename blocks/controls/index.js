function applyOrUnset( position ) {
	return ( attributes, setAttributes ) => {
		const nextPosition = attributes.position === position ? undefined : position;
		setAttributes( { position: nextPosition } );
	};
}

const controls = {
	'core/position-left': {
		icon: 'align-left',
		title: wp.i18n.__( 'Position left' ),
		isActive: ( { position } ) => 'left' === position,
		onClick: applyOrUnset( 'left' )
	},
	'core/position-center': {
		icon: 'align-center',
		title: wp.i18n.__( 'Position center' ),
		isActive: ( { position } ) => 'center' === position,
		onClick: applyOrUnset( 'center' )
	},
	'core/position-right':	{
		icon: 'align-right',
		title: wp.i18n.__( 'Position right' ),
		isActive: ( { position } ) => 'right' === position,
		onClick: applyOrUnset( 'right' )
	},
	'core/position-none': {
		icon: 'align-none',
		title: wp.i18n.__( 'No positionning' ),
		isActive: ( { position } ) => ! position || 'none' === position,
		onClick: applyOrUnset( 'none' )
	}
};

export default controls;
