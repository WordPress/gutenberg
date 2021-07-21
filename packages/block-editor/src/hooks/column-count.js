/**
 * WordPress dependencies
 */
import { hasBlockSupport } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import ColumnCountControl from '../components/column-count-control';
import useSetting from '../components/use-setting';
import { cleanEmptyObject } from './utils';

export const COLUMN_COUNT_SUPPORT_KEY = 'typography.__experimentalColumnCount';

/**
 * Inspector control allowing management of CSS columns count.
 *
 * @param {Object} props Block properties.
 * @return {WPElement} Column Count edit element.
 */
export function ColumnCountEdit( props ) {
	const {
		attributes: { style },
		setAttributes,
	} = props;
	const isDisabled = useIsColumnCountDisabled( props );

	if ( isDisabled ) {
		return null;
	}

	function onChange( next ) {
		const newStyle = {
			...style,
			typography: {
				...style?.typography,
				columnCount: next,
			},
		};

		setAttributes( { style: cleanEmptyObject( newStyle ) } );
	}

	return (
		<ColumnCountControl
			value={ style?.typography?.columnCount }
			onChange={ onChange }
		/>
	);
}

/**
 * Checks if the column count setting has been disabled.
 *
 * @param {string} name Name of the block.
 * @return {boolean} Whether or not the setting is disabled.
 */
export function useIsColumnCountDisabled( { name } = {} ) {
	const notSupported = ! hasBlockSupport( name, COLUMN_COUNT_SUPPORT_KEY );
	const hasColumnCount = useSetting( 'typography.customColumnCount' );

	return notSupported || ! hasColumnCount;
}
