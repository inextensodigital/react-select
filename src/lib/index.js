/* eslint-disable react/no-multi-comp, jsx-a11y/no-static-element-interactions, no-console, react/no-unused-prop-types */
import React from 'react'
import PropTypes from 'prop-types'

import { isEqual, debounce, uniq, random } from './helpers/helpers'
import getOptions from './helpers/getOptions'
import handleKeyDown from './helpers/handleKeyDown'
import { handleText } from './helpers/handler'
import customValidator from './helpers/customValidator'

import { Root, Label } from './Styled'

import Field from './Field'
import Options from './Options'
import Required from './Required'

export default class Select extends React.Component {
  state = {
    displayOptions: false,
    filterText: '',
    values: this.props.values,
    selected: 0,
  }

  componentDidMount() {
    this.debouncedHandleSize = debounce(this.handleSize, 300)
    document.addEventListener('mousedown', this.handleBlur)
    window.addEventListener('resize', this.debouncedHandleSize)
  }

  componentWillReceiveProps(nextProps) {
    if (!isEqual(nextProps.values, this.state.values)) {
      this.setState({ values: nextProps.values })
    }
    if (nextProps.filter && !isEqual(nextProps.filter, this.state.filter)) {
      this.setState({ filterText: nextProps.filter })
    }
  }

  componentDidUpdate() {
    customValidator(this.props.customValidator, this.input)

    if (this.options && this.props.reachedTop) {
      if (this.options.scrollTop !== 0) this.reachedTop = false
      else this.reachedTop = true
    }

    if (this.options && this.props.reachedBottom) {
      const { scrollTop, scrollHeight, offsetHeight } = this.options
      if (scrollTop !== scrollHeight - offsetHeight) this.reachedBottom = false
      else this.reachedBottom = true
    }
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleBlur)
    window.removeEventListener('resize', this.debouncedHandleSize)
  }

  input = null

  getInputRef = elm => {
    this.input = elm
  }

  onChange = () => {
    this.props.onChange(this.state.values.map(v => v.value), this.state.values)

    if (this.props.multi) this.handleFocus()

    if (!this.props.multi && this.state.values[0]) {
      this.input.blur()
      this.setState({ displayOptions: false })
    }
    this.setState({ selected: 0, filterText: '' })
  }

  handleSize = () => {
    if (this.body) this.setState({ width: this.body.offsetWidth })
  }

  handleKey = e => {
    const { selected, values, filterText } = this.state
    const { options, onEnter } = this.props
    e.persist()
    const value = handleKeyDown(
      e,
      selected,
      values,
      filterText,
      options,
      onEnter,
      this.handleValue,
    )
    if (value)
      this.setState(value, (...params) => {
        if (e.key === 'Backspace' && filterText === '') this.onChange(params)
      })
  }

  handleFocus = () => {
    this.props.onFocus && this.props.onFocus()
    this.input.focus()
    this.setState({ displayOptions: true })
    this.handleSize()
  }

  handleArrow = () => {
    const { displayOptions } = this.state
    this.setState({ displayOptions: !displayOptions })
    this.handleSize()
  }

  handleValue = value => {
    if (this.props.multi) {
      this.setState(
        { values: uniq([...this.state.values, value]), filterText: '' },
        this.onChange,
      )
    } else {
      this.setState({ values: [value], filterText: '' }, this.onChange)
    }
  }

  handleInputChange = e => {
    const { onTextChange } = this.props
    this.setState({
      filterText: handleText(e, onTextChange).filterText,
      selected: handleText(e, onTextChange).selected,
    })
  }

  handleRemove = value => {
    this.setState(
      { values: this.state.values.filter(v => v.value !== value) },
      this.onChange,
    )
  }

  handleBlur = e => {
    if (this.body && !this.body.contains(e.target)) {
      this.setState({ displayOptions: false, selected: 0 })
    }
  }

  render = () => {
    const { displayOptions, values, selected, filterText, width } = this.state
    const {
      label,
      customValidator,
      placeholder,
      Header,
      Footer,
      forceHeader,
      forceFooter,
      forceCustomNoResult,
      options,
      onKeyDown,
      disabled,
      noFilter,
      inputMinWidth,
      maxHeight,
      reachedTop,
      reachedBottom,
      CustomOption,
      CustomTag,
      CustomNoResult,
    } = this.props

    const OptionsWithoutValues = getOptions(values, filterText, options)
    const displayNoResult =
      (OptionsWithoutValues.length === 0 && filterText !== '') ||
      forceCustomNoResult
    const labelTopStyle =
      filterText !== '' || displayOptions || values.length > 0 || placeholder
    const randomId = random()

    return (
      <Root
        innerRef={body => {
          this.body = body
        }}
        onKeyDown={e => {
          this.handleKey(e)
          onKeyDown && onKeyDown(e, options[selected])
        }}
        disabled={disabled}
        onScroll={e => e.stopPropagation()}
        onClick={this.focus}
        label={label}
      >
        {label && (
          <Label changeStyle={labelTopStyle} onClick={this.handleFocus}>
            {label}
            {customValidator && <Required displayOptions={displayOptions} />}
          </Label>
        )}
        <Field
          values={values}
          disabled={disabled}
          noFilter={noFilter}
          handleChange={this.handleInputChange}
          handleRemove={this.handleRemove}
          filterText={filterText}
          name={`select-search-${randomId}`}
          handleFocus={this.handleFocus}
          placeholder={placeholder}
          minWidth={inputMinWidth}
          innerRef={this.getInputRef}
          CustomTag={CustomTag}
          label={label}
          displayOptions={displayOptions}
          handleArrow={this.handleArrow}
        />
        {displayOptions && (
          <Options
            options={OptionsWithoutValues}
            forceHeader={forceHeader}
            Header={Header}
            noResult={displayNoResult}
            handleValue={this.handleValue}
            selected={selected}
            forceFooter={forceFooter}
            Footer={Footer}
            width={width}
            maxHeight={maxHeight}
            reachedBottom={reachedBottom}
            reachedTop={reachedTop}
            CustomOption={CustomOption}
            CustomNoResult={CustomNoResult}
          />
        )}
      </Root>
    )
  }
}

Select.propTypes = {
  filter: PropTypes.string,
  onChange: PropTypes.func,
  onTextChange: PropTypes.func,
  CustomOption: PropTypes.func,
  CustomNoResult: PropTypes.func,
  CustomTag: PropTypes.func,
  Header: PropTypes.func,
  Footer: PropTypes.func,
  options: PropTypes.arrayOf(PropTypes.shape({})),
  noFilter: PropTypes.bool,
  multi: PropTypes.bool,
  values: PropTypes.arrayOf(PropTypes.shape({})),
  label: PropTypes.string,
  placeholder: PropTypes.string,
  customValidator: PropTypes.func,
  disabled: PropTypes.bool,
  maxHeight: PropTypes.number,
  inputMinWidth: PropTypes.number,
  preventParentScroll: PropTypes.bool,
  reachedTop: PropTypes.func,
  reachedBottom: PropTypes.func,
  forceHeader: PropTypes.bool,
  forceFooter: PropTypes.bool,
  forceCustomNoResult: PropTypes.bool,
  onEnter: PropTypes.func,
  onFocus: PropTypes.func,
}

Select.defaultProps = {
  onChange: () => console.warn('Add a onChange props to your Select'),
  onTextChange: () => null,
  CustomOption: undefined,
  CustomTag: undefined,
  CustomNoResult: undefined,
  Header: undefined,
  Footer: undefined,
  options: [],
  placeholder: '',
  noFilter: false,
  multi: false,
  values: [],
  label: null,
  customValidator: undefined,
  disabled: false,
  maxHeight: 150,
  inputMinWidth: 10,
  preventParentScroll: false,
  reachedTop: undefined,
  reachedBottom: undefined,
  filter: undefined,
  forceHeader: false,
  forceFooter: false,
  forceCustomNoResult: false,
  onEnter: undefined,
  onFocus: undefined,
}
