import React, { createElement, Component } from 'react'
import ReactDOM from 'react-dom'
import cx from 'classnames';

import * as Icons from '../../external/dashicons'
import Dropbutton from '../dropbutton/Dropbutton'
import Button from '../button/Button'
import styles from './blocktoolbar.scss'

export default class BlockToolbar extends React.Component {

	render() {

		const H1Button = props => <Button><Icons.EditorHeadingIcon /></Button>
		const ParagraphButton = props => <Button><Icons.EditorParagraphIcon /></Button>
		const QuoteButton = props => <Button><Icons.EditorQuoteIcon /></Button>

		const AlignLeftButton = props => <Button className={styles.horizontal} ><Icons.EditorAlignLeftIcon /></Button>;
		const AlignRightButton = props => <Button className={styles.horizontal} ><Icons.EditorAlignRightIcon /></Button>;
		const AlignCenterButton = props => <Button className={styles.horizontal} ><Icons.EditorAlignCenterIcon /></Button>;

		// TODO: add option types
		let hidden = this.props.collapsed === null || !this.props.collapsed

		return hidden ? null : (
			<div className={styles.toolbar} onMouseEnter={() => { }}>

				<Dropbutton status={'ACTIVE'}
					dropchoices={[<ParagraphButton key="pbutton" />, <QuoteButton key="qbutton" />]}
					hoverchoices={[
						<AlignLeftButton key="left"  className={styles.horizontal} />,
						<AlignRightButton key="right"  className={styles.horizontal} />,
						<AlignCenterButton key="center" className={styles.horizontal}  />
					]}
					selected={<H1Button key="h1button" />} />


				<Dropbutton status={'INACTIVE'}
					dropchoices={[<H1Button key="h1button" />, <QuoteButton key="qbutton" />]}
					hoverchoices={[
						<AlignLeftButton key="left"  className={styles.horizontal} />,
						<AlignRightButton key="right"  className={styles.horizontal} />,
						<AlignCenterButton key="center" className={styles.horizontal}  />
					]}
					selected={<ParagraphButton key="pbutton" />} />


				<Dropbutton status={'INACTIVE'}
					dropchoices={[<H1Button key="h1button" />, <ParagraphButton key="pbutton" />]}
					hoverchoices={[
						<AlignLeftButton key="left"  className={styles.horizontal} />,
						<AlignRightButton key="right"  className={styles.horizontal} />,
						<AlignCenterButton key="center" className={styles.horizontal}  />
					]}
					selected={<QuoteButton key="qbutton" />} />


			</div>
		)
	}
}