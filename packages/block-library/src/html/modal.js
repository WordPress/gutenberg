/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Modal,
	privateApis as componentsPrivateApis,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { PlainText } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';
import Preview from './preview';

const { Tabs } = unlock( componentsPrivateApis );

export default function HTMLEditModal( {
	isOpen,
	onRequestClose,
	content,
	setAttributes,
} ) {
	if ( ! isOpen ) {
		return null;
	}

	return (
		<Modal
			title={ __( 'Edit HTML' ) }
			onRequestClose={ onRequestClose }
			className="block-library-html__modal"
			size="large"
		>
			<Tabs orientation="vertical" defaultTabId="html">
				<HStack
					alignment="stretch"
					justify="flex-start"
					spacing={ 4 }
					className="block-library-html__modal-tabs"
				>
					<div>
						<Tabs.TabList>
							<Tabs.Tab tabId="html">HTML</Tabs.Tab>
							<Tabs.Tab tabId="preview">
								{ __( 'Preview' ) }
							</Tabs.Tab>
						</Tabs.TabList>
					</div>
					<div style={ { flexGrow: 1 } }>
						<Tabs.TabPanel
							tabId="html"
							focusable={ false }
							className="block-library-html__modal-tab"
						>
							<PlainText
								value={ content }
								onChange={ ( newContent ) =>
									setAttributes( { content: newContent } )
								}
								placeholder={ __( 'Write HTML…' ) }
								aria-label={ __( 'HTML' ) }
								className="block-library-html__modal-editor"
							/>
						</Tabs.TabPanel>
						<Tabs.TabPanel
							tabId="preview"
							focusable={ false }
							className="block-library-html__modal-tab"
						>
							<Preview content={ content } isSelected />
						</Tabs.TabPanel>
					</div>
				</HStack>
			</Tabs>
		</Modal>
	);
}
