/**
 * WordPress dependencies
 */
import { StyledPrimitives, styled } from '@wordpress/components';

const Button = styled( StyledPrimitives.Button )`
&:hover {
	text-decoration: underline;
	cursor: pointer;
	color: ${ ( props ) => props.theme.colors.primary };
}
&:focus{
	outline: none;
	outline-offset: -2px;
	box-shadow: none;
}
`;

export default function BlockBreadcrumbButton( { children, ...props } ) {
	return <Button
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
		{ ...props }
	>
		{ children }
	</Button>;
}
