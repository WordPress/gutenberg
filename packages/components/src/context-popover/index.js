/**
 * External dependencies
 */
import { random } from 'lodash';
import styled from '@emotion/styled';
import { usePopoverState, Popover, PopoverDisclosure } from 'reakit/Popover';

/**
 * Internal dependencies
 */
import Button from '../button';
import Card from '../card';
import CardBody from '../card/body';
import Panel from '../panel';
import PanelBody from '../panel/body';
import CardHeader from '../card/header';
import { Flex, FlexItem } from '../flex';
import ColorPalette from '../color-palette';
import ColorIndicator from '../color-indicator';
import RangeControl from '../range-control';
import Text from '../text';

function ContextPopover( { children, trigger, title } ) {
	const popover = usePopoverState( {
		animated: 200,
		placement: 'left-start',
		modal: true,
	} );

	return (
		<>
			<PopoverDisclosure
				{ ...popover }
				as={ Trigger }
				isOpen={ popover.visible }
			>
				{ trigger }
			</PopoverDisclosure>
			<Popover
				{ ...popover }
				aria-label="Welcome"
				as={ Wrapper }
				tabIndex={ 0 }
			>
				<AnimatedWrapper>
					<Card isBorderless isElevated size="small">
						<PopoverHeader>
							<FlexItem>
								<Text
									as="div"
									fontWeight={ 600 }
									fontSize={ 14 }
								>
									{ title }
								</Text>
							</FlexItem>
							<CloseButtonWrapper>
								<Button
									isSmall
									onClick={ () => popover.hide() }
								>
									Close
								</Button>
							</CloseButtonWrapper>
						</PopoverHeader>
						<PopoverContentWrapper>
							{ children }
						</PopoverContentWrapper>
					</Card>
				</AnimatedWrapper>
			</Popover>
		</>
	);
}

const Sidebar = styled.div`
	align-items: center;
	width: 265px;
	height: 100vh;
	box-shadow: 0 0 0 1px #ddd inset;
	margin-left: auto;
	position: relative;
	overflow-y: auto;
`;

const SidebarContent = styled.div`
	min-height: 100vh;
	box-sizing: border-box;
`;

const Wrapper = styled.div`
	max-width: 285px;
	padding: 0;
	width: 100%;
	z-index: 9999;
`;

const AnimatedWrapper = styled.div`
	opacity: 0;
	transition: all 100ms linear;
	transform-origin: top right;

	[data-enter] & {
		opacity: 1;
	}
`;

const PopoverHeader = styled( CardHeader )`
	padding-top: 8px !important;
	padding-bottom: 8px !important;
`;

const PopoverContentWrapper = styled.div`
	max-height: 70vh;
	overflow-y: auto;
`;

const CloseButtonWrapper = styled( FlexItem )`
	margin-right: -8px;
`;

const Trigger = styled.div`
	padding: 8px 8px;
	margin: 0 -8px;
	border-radius: 3px;
	box-shadow: 0 0 0 1px rgba( 0, 0, 0, 0 );

	&:hover {
		box-shadow: 0 0 0 1px rgba( 0, 0, 0, 0.1 );
	}

	${ ( { isOpen } ) => {
		return (
			isOpen &&
			`
			background: rgba( 0, 0, 0, 0.04 );
		`
		);
	} }
`;

const Spacer = styled.div`
	padding-bottom: 16px;
`;

function ColorPopover( { color, title } ) {
	const colors = [
		{ name: 'red', color: '#f00' },
		{ name: 'white', color: '#fff' },
		{ name: 'blue', color: '#00f' },
	];

	return (
		<ContextPopover
			title={ `${ title } color` }
			trigger={
				<Flex>
					<FlexItem>
						<Text fontWeight={ 600 }>{ title }</Text>
					</FlexItem>
					<FlexItem>
						<ColorIndicator colorValue={ color } />
					</FlexItem>
				</Flex>
			}
		>
			<CardBody>
				<ColorPalette
					colors={ colors }
					__experimentalDisableCustomColorsPopover={ true }
				/>
				<Spacer />
				<RangeControl label="Opacity" />
				<RangeControl label="Hue" />
			</CardBody>
		</ContextPopover>
	);
}

function FilterPopover() {
	return (
		<ContextPopover
			title={ `Filter settings` }
			trigger={
				<Flex>
					<FlexItem>
						<Text fontWeight={ 600 }>Filters</Text>
					</FlexItem>
					<FlexItem>
						<Text>Custom</Text>
					</FlexItem>
				</Flex>
			}
		>
			<CardBody>
				<RangeControl label="Opacity" />
				<RangeControl label="Hue" />
				<RangeControl label="Saturation" />
				<RangeControl label="Contrast" />
				<RangeControl label="Sepia" />
				<RangeControl label="Brightness" />
				<RangeControl label="Contrast" />
			</CardBody>
		</ContextPopover>
	);
}

function BoxShadowPopover() {
	const colors = [
		{ name: 'red', color: '#f00' },
		{ name: 'white', color: '#fff' },
		{ name: 'blue', color: '#00f' },
	];
	return (
		<ContextPopover
			title={ `Box Shadow` }
			trigger={
				<Flex>
					<FlexItem>
						<Text fontWeight={ 600 }>Box shadow</Text>
					</FlexItem>
					<FlexItem>
						<Text>1px 2px 4px</Text>
						<ColorIndicator colorValue="#000" />
					</FlexItem>
				</Flex>
			}
		>
			<CardBody>
				<RangeControl label="Spread" />
				<RangeControl label="Weight" />
				<ColorPalette
					colors={ colors }
					__experimentalDisableCustomColorsPopover={ true }
				/>
			</CardBody>
		</ContextPopover>
	);
}

function Example() {
	return (
		<Sidebar className="sidebar">
			<SidebarContent>
				<div style={ { height: `${ random( 10, 20 ) }vh` } } />
				<Panel>
					<PanelBody title="Color">
						<ColorPopover title="Text" color="red" />
						<ColorPopover title="Background" color="white" />
						<ColorPopover title="Link" color="blue" />
					</PanelBody>
				</Panel>
				<Panel>
					<PanelBody title="Background">
						<img
							src="https://s.w.org/images/home/screen-themes.png?3"
							alt="WP"
							style={ { maxWidth: '100%' } }
						/>
						<Spacer />
						<FilterPopover />
					</PanelBody>
				</Panel>
				<Panel>
					<PanelBody title="Effect">
						<BoxShadowPopover />
					</PanelBody>
				</Panel>
				<div style={ { height: `${ 40 }vh` } } />
			</SidebarContent>
		</Sidebar>
	);
}

export default Example;
