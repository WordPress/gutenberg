/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { __experimentalBlockPatternPicker } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import MediaTextContainer from './media-text-container';

const MediaTextEdit = ( props ) => {
	const { name } = props;
	const { blockType, defaultPattern, patterns } = useSelect( ( select ) => {
		const {
			__experimentalGetBlockPatterns,
			getBlockType,
			__experimentalGetDefaultBlockPattern,
		} = select( 'core/blocks' );

		return {
			blockType: getBlockType( name ),
			defaultPattern: __experimentalGetDefaultBlockPattern( name ),
			patterns: __experimentalGetBlockPatterns( name ),
		};
	}, [ name ] );

	const [ pattern, setPattern ] = useState( null );

	if ( pattern ) {
		return (
			<MediaTextContainer { ...props } />
		);
	}

	return (
		<__experimentalBlockPatternPicker
			icon={ get( blockType, [ 'icon', 'src' ] ) }
			label={ get( blockType, [ 'title' ] ) }
			patterns={ patterns }
			onSelect={ ( nextPattern = defaultPattern ) => {
				if ( nextPattern.attributes ) {
					props.setAttributes( nextPattern.attributes );
				}
				setPattern( nextPattern );
			} }
			allowSkip
		/>
	);
};

export default MediaTextEdit;
