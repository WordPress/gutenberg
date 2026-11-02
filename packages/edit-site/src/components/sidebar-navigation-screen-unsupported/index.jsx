import { __ } from '@wordpress/i18n';
import {
	Notice as WCNotice,
	__experimentalSpacer as Spacer,
} from '@wordpress/components';

export default function SidebarNavigationScreenUnsupported() {
	return (
		<Spacer padding={ 3 }>
			<WCNotice status="warning" isDismissible={ false }>
				{ __(
					'The theme you are currently using does not support this screen.'
				) }
			</WCNotice>
		</Spacer>
	);
}
