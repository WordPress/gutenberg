/**
 * WordPress dependencies
 */
import {
	MenuItem,
	NavigatorLink,
	__experimentalText as Text,
} from '@wordpress/components';

export const SettingLink = ( { prefix, title, to } ) => {
	return (
		<NavigatorLink to={ to }>
			<MenuItem prefix={ prefix } showArrow>
				<Text weight={ 600 }>{ title }</Text>
			</MenuItem>
		</NavigatorLink>
	);
};
