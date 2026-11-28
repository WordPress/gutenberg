import {
	Navigator,
	__experimentalItem as WCItem,
	FlexItem,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { IconWithCurrentColor } from './icon-with-current-color';

interface GenericNavigationButtonProps {
	icon?: any;
	children: React.ReactNode;
	[ key: string ]: any;
}

function GenericNavigationButton( {
	icon,
	children,
	...props
}: GenericNavigationButtonProps ) {
	return (
		<WCItem { ...props }>
			{ icon && (
				<HStack justify="flex-start">
					<IconWithCurrentColor icon={ icon } size={ 24 } />
					<FlexItem>{ children }</FlexItem>
				</HStack>
			) }
			{ ! icon && children }
		</WCItem>
	);
}

interface NavigationButtonProps {
	path: string;
	icon?: any;
	children: React.ReactNode;
	[ key: string ]: any;
}

export function NavigationButtonAsItem( props: NavigationButtonProps ) {
	return <Navigator.Button as={ GenericNavigationButton } { ...props } />;
}
