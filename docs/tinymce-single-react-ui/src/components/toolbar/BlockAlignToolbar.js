import React, { createElement, Component } from 'react'
import ReactDOM from 'react-dom'
import cx from 'classnames';

import * as Icons from '../../external/dashicons'
import Button from '../button/Button'
import styles from './blocktoolbar.scss'
import {blockAlignIconMap, blockAlignList} from '../../utils/tag'

export default function BlockAlignToolbar(props) {

  return props.isOpen ? (
    <div className={cx(styles.horizontal, styles.toolbarStyle)}>
      {blockAlignList.map( (choice, index) => (
        <Button key={index} extraClass={[ styles.horizontal ]}>
          {blockAlignIconMap[choice]}
        </Button>
        )
      )}
    </div>
  )
  : null
}