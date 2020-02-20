/**
 * WordPress dependencies
 */
import { PrimitiveButton, useTheme } from '@wordpress/components';

export default function BlockBreadcrumbButton( { children, ...props } ) {
	const theme = useTheme();
	const additionalStyles = [
		{
			states: 'hover',
			styles: {
				'text-decoration': 'underline',
				cursor: 'pointer',
				color: theme.colors.primary,
			},
		},
		{
			states: 'focus',
			styles: {
				outline: 'none',
				'outline-offset': '-2px',
				'box-shadow': 'none',
			},
		},
		{
			states: 'focus:hover',
			styles: {
				color: 'pink',
			},
		},
		{
			states: 'focus:hover:active',
			styles: {
				color: 'orange',
			},
		},
	];
	return (
		<PrimitiveButton
			className="block-editor-block-breadcrumb__button"
			px={ 'medium' }
			py={ 0 }
			color={ 'dark-gray-500' }
			fontSize={ 'inherit' }
			line-height={ 'xlarge' }
			height={ 28 }
			isTertiary
			display={ 'inline-flex' }
			textDecoration={ 'none' }
			border={ 0 }
			additionalStyles={ additionalStyles }
			{ ...props }
		>
			{ children }
		</PrimitiveButton>
	);
}
