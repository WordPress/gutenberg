/**
 * External dependencies
 */
import styled from '@emotion/styled';
import { css } from '@emotion/core';

const GRID_BASE = 4;

const spacerStyles = ( {
	mt,
	mb,
	mr,
	ml,
	mx,
	my,
	pt,
	pb = 3,
	pr,
	pl,
	px,
	py,
	m,
	p,
} ) => {
	const styles = {};

	if ( mt ) {
		styles.marginTop = value( mt );
	}
	if ( mb ) {
		styles.marginBottom = value( mb );
	}
	if ( ml ) {
		styles.marginLeft = value( ml );
	}
	if ( mr ) {
		styles.marginRight = value( mr );
	}
	if ( mx ) {
		styles.marginLeft = value( mx );
		styles.marginRight = value( mx );
	}
	if ( my ) {
		styles.marginTop = value( my );
		styles.marginBottom = value( my );
	}
	if ( m ) {
		styles.marginTop = value( m );
		styles.marginBottom = value( m );
		styles.marginLeft = value( m );
		styles.marginRight = value( m );
	}

	if ( pt ) {
		styles.paddingTop = value( pt );
	}
	if ( pb ) {
		styles.paddingBottom = value( pb );
	}
	if ( pl ) {
		styles.paddingLeft = value( pl );
	}
	if ( pr ) {
		styles.paddingRight = value( pr );
	}
	if ( px ) {
		styles.paddingLeft = value( px );
		styles.paddingRight = value( px );
	}
	if ( py ) {
		styles.paddingTop = value( py );
		styles.paddingBottom = value( py );
	}
	if ( p ) {
		styles.paddingTop = value( p );
		styles.paddingBottom = value( p );
		styles.paddingLeft = value( p );
		styles.paddingRight = value( p );
	}

	return css( styles );
};

function value( val ) {
	return `${ parseFloat( val ) * GRID_BASE }px`;
}

const SpacerView = styled.div`
	${ spacerStyles };
`;

function Spacer( { pb = 3, ...props } ) {
	return <SpacerView pb={ pb } { ...props } />;
}

export default Spacer;
