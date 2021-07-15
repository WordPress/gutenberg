/**
 * External dependencies
 */
import { css } from '@emotion/react';
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import { useCx } from '../hooks';
import {
	SUPPORTED_COLORS,
	getBackgroundColor,
	getTextColorForBackgroundColor,
} from '../backgrounds';
import { HStack } from '../../h-stack';

export default {
	title: 'Components (Experimental)/Background Colors',
};

const WhiteBackground = styled( HStack )`
	background-color: white;
	padding: 2em;
`;

const BlackBackground = styled( WhiteBackground )`
	background-color: black;
`;

const Example = ( { color, isBold } ) => {
	const cx = useCx();

	const textColor = getTextColorForBackgroundColor( color, { isBold } );
	const bgColor = getBackgroundColor( color, { isBold } );

	const classes = cx(
		bgColor,
		textColor,
		css( {
			padding: '1em',
			borderRadius: '2px',
			borderColor: color,
			borderStyle: 'solid',
			borderWidth: '1px',
		} )
	);

	return <span className={ classes }>This is an example</span>;
};

export const _default = () => {
	return (
		<>
			<WhiteBackground wrap>
				{ SUPPORTED_COLORS.map( ( color ) => (
					<Example color={ color } key={ color } />
				) ) }
				{ SUPPORTED_COLORS.map( ( color ) => (
					<Example color={ color } key={ color } isBold />
				) ) }
			</WhiteBackground>
			<BlackBackground wrap>
				{ SUPPORTED_COLORS.map( ( color ) => (
					<Example color={ color } key={ color } />
				) ) }
				{ SUPPORTED_COLORS.map( ( color ) => (
					<Example color={ color } key={ color } isBold />
				) ) }
			</BlackBackground>
		</>
	);
};
