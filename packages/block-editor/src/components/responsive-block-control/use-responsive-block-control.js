/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

const useResponsiveBlockControl = ( initialState = false ) => {
	const [ isResponsive, setIsResponsive ] = useState( initialState );

	const onIsResponsiveChange = () => {
		setIsResponsive( ! isResponsive );
	};

	return [
		isResponsive,
		onIsResponsiveChange,
	];
};

export default useResponsiveBlockControl;
