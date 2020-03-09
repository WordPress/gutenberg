/**
 * External dependencies
 */
import { isUndefined, isNaN } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { TextControl } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { DOWN, UP } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { LineHeightControlWrapper } from './styles';

const BASE_DEFAULT_VALUE = 1.5;
const STEP = 0.1;

export default function LineHeightControl( props ) {
	const [ lineHeight, setLineHeight ] = useLineHeightState();

	// Handles cases when there is no lineHeight defined.
	// Improves interaction by starting with a base of 1.5, rather than 0.
	const handleOnKeyDown = ( event ) => {
		if ( ! isUndefined( lineHeight ) ) return;

		switch ( event.keyCode ) {
			case UP:
				event.preventDefault();
				return setLineHeight( BASE_DEFAULT_VALUE + STEP );
			case DOWN:
				event.preventDefault();
				return setLineHeight( BASE_DEFAULT_VALUE - STEP );
		}
	};

	return (
		<LineHeightControlWrapper>
			<TextControl
				autoComplete="off"
				onChange={ setLineHeight }
				onKeyDown={ handleOnKeyDown }
				label={ __( 'Line height' ) }
				placeholder={ BASE_DEFAULT_VALUE }
				step={ STEP }
				type="number"
				value={ lineHeight }
				{ ...props }
				min={ 0 }
			/>
		</LineHeightControlWrapper>
	);
}

export function getLineHeightControlStyles( attributes ) {
	const { lineHeight } = attributes;

	return {
		'--wp--core-paragraph--line-height': `${ lineHeight * 100 }%`,
	};
}

export function getLineHeightControlClassName( attributes ) {
	const { lineHeight } = attributes;

	return ! isUndefined( lineHeight ) ? 'has-line-height' : '';
}

function useLineHeightState() {
	const attributes = useBlockAttributes();
	const setAttributes = useSetAttributes();

	const { lineHeight } = attributes;
	const setLineHeight = ( value ) =>
		setAttributes( { lineHeight: parseFloat( value ) } );

	let value = parseFloat( lineHeight );

	if ( isNaN( value ) ) {
		value = undefined;
	}

	return [ value, setLineHeight ];
}

function useBlockAttributes() {
	const clientId = useSelectedBlockClientId();
	const { attributes } = useSelect( ( select ) => {
		const { __unstableGetBlockWithoutInnerBlocks } = select(
			'core/block-editor'
		);
		return __unstableGetBlockWithoutInnerBlocks( clientId ) || {};
	}, [] );

	return attributes;
}

function useSelectedBlockClientId() {
	const clientId = useSelect( ( select ) => {
		const { getSelectedBlockClientId } = select( 'core/block-editor' );
		return getSelectedBlockClientId();
	}, [] );

	return clientId;
}

function useSetAttributes() {
	const clientId = useSelectedBlockClientId();
	const { updateBlockAttributes } = useDispatch( 'core/block-editor' );

	const setAttributes = ( newAttributes ) => {
		updateBlockAttributes( clientId, newAttributes );
	};

	return setAttributes;
}
