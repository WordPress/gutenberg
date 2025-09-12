
/**
 * External dependencies
 */
import React from 'react';

/**
 * WordPress dependencies
 */
import { 
	Icon,
	__experimentalInputControlPrefixWrapper as InputControlPrefixWrapper,
	__experimentalInputControlSuffixWrapper as InputControlSuffixWrapper,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import type { DataFormControlProps } from '../types';
import ValidatedText from './utils/validated-input';

export default function Text< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
	config,
}: DataFormControlProps< Item > ) {
	const { prefix, suffix } = config || {};

	return (
		<ValidatedText
			{ ...{
				data,
				field,
				onChange,
				hideLabelFromVision,
				prefix: prefix ? React.createElement( prefix ) : undefined,
				suffix: suffix ? React.createElement( suffix ) : undefined,
			} }
		/>
	);
}
