/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalVStack as VStack,
	__experimentalSpacer as Spacer,
	__experimentalText as Text,

} from '@wordpress/components';

function FontsGrid( { title, children } ) {
	return (
		<div className='font-library-modal__fonts-grid'>
			<VStack spacing={4}>
				{title && (
					<Text className="font-library-modal__fonts-grid__subtitle">{ title }</Text>
				)}
				<div className="font-library-modal__fonts-grid__main">
					{ children }
				</div>
			</VStack>
		</div>
	);
}

export default FontsGrid;
