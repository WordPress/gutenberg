import {
	Icon as WCIcon,
	__experimentalText as WCText,
	__experimentalHStack as HStack,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { mobile } from '@wordpress/icons';
import { unlock } from '../../lock-unlock';
import { store as blockEditorStore } from '../../store';
import { getResponsiveStylesLabel } from '../../hooks/block-style-state';

const { Badge: WCBadge } = unlock( componentsPrivateApis );

export default function ResponsiveStylesInfo( { clientId } ) {
	const responsiveStylesLabel = useSelect(
		( select ) => {
			const { getBlockAttributes } = unlock( select( blockEditorStore ) );
			return getResponsiveStylesLabel(
				getBlockAttributes( clientId )?.style
			);
		},
		[ clientId ]
	);

	if ( ! responsiveStylesLabel ) {
		return null;
	}

	return (
		<WCBadge className="block-editor-block-inspector__responsive-styles-info">
			<HStack spacing={ 2 } justify="start">
				<WCIcon icon={ mobile } />
				<WCText>{ responsiveStylesLabel }</WCText>
			</HStack>
		</WCBadge>
	);
}
