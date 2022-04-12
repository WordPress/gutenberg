/**
 * External dependencies
 */
import { capitalize } from 'lodash';

/**
 * WordPress dependencies
 */
import { useState, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BoxControl from '../../box-control';
import { Flex, FlexBlock } from '../../flex';

import BoxModelOverlay from '../index';

export default {
	title: 'Components (Experimental)/BoxModelOverlay',
	component: BoxModelOverlay,
};

const SHOW_VALUES = {
	margin: {
		top: true,
		right: true,
		bottom: true,
		left: true,
	},
	padding: {
		top: true,
		right: true,
		bottom: true,
		left: true,
	},
};

const Template = ( { width, height, showValues, styles } ) => {
	return (
		<BoxModelOverlay showValues={ showValues }>
			<div
				style={ {
					width,
					height,
					background: '#ddd',
					resize: 'both',
					overflow: 'auto',
					...styles,
				} }
			/>
		</BoxModelOverlay>
	);
};

export const _default = Template.bind( {} );
_default.args = {
	width: 300,
	height: 300,
	showValues: SHOW_VALUES,
	styles: {
		margin: '20px 20px 20px 20px',
		padding: '5% 5% 5% 5%',
	},
};

export const WithBoxControl = ( {
	width,
	height,
	parentWidth,
	parentHeight,
} ) => {
	const [ marginValues, setMarginValues ] = useState( {
		top: '20px',
		left: '20px',
		right: '20px',
		bottom: '20px',
	} );
	const [ paddingValues, setPaddingValues ] = useState( {
		top: '5%',
		left: '5%',
		right: '5%',
		bottom: '5%',
	} );
	const [ showMarginValues, setShowMarginValues ] = useState( {} );
	const [ showPaddingValues, setShowPaddingValues ] = useState( {} );

	const boxStyle = {};
	Object.entries( marginValues ).forEach( ( [ side, value ] ) => {
		boxStyle[ `margin${ capitalize( side ) }` ] = value;
	} );
	Object.entries( paddingValues ).forEach( ( [ side, value ] ) => {
		boxStyle[ `padding${ capitalize( side ) }` ] = value;
	} );

	return (
		<Flex style={ { maxWidth: '780px' } } align="top" gap={ 8 }>
			<FlexBlock>
				<BoxControl
					label="Margin"
					values={ marginValues }
					onChange={ setMarginValues }
					onChangeShowVisualizer={ setShowMarginValues }
					// To ignore the error for incorrect types in BoxControl.
					id={ undefined }
					units={ undefined }
					sides={ undefined }
				/>
				<BoxControl
					label="Padding"
					values={ paddingValues }
					onChange={ setPaddingValues }
					onChangeShowVisualizer={ setShowPaddingValues }
					// To ignore the error for incorrect types in BoxControl.
					id={ undefined }
					units={ undefined }
					sides={ undefined }
				/>
			</FlexBlock>
			<FlexBlock>
				<div style={ { width: parentWidth, height: parentHeight } }>
					<BoxModelOverlay
						showValues={ {
							margin: showMarginValues,
							padding: showPaddingValues,
						} }
					>
						<div
							style={ {
								width,
								height,
								background: '#ddd',
								resize: 'both',
								overflow: 'auto',
								...boxStyle,
							} }
						/>
					</BoxModelOverlay>
				</div>
			</FlexBlock>
		</Flex>
	);
};

WithBoxControl.args = {
	width: 300,
	height: 300,
	parentWidth: 500,
	parentHeight: 500,
};
