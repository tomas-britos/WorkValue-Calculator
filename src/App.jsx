import { useState, useEffect, useRef, useCallback } from 'react'
import Select from 'react-select'
import { useLocale } from './i18n/index.js'
import './App.css'
import {
  DEFAULT_INPUTS,
  WEEKDAY_KEYS,
  calculateWorkValue,
  toggleDayOverride,
  sanitizeDaysInMonth,
} from './workValueCalculator.js'

function formatNumber(n) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

function App() {
  const { t, formatNumber: localeFormat, dayAbbrev, locale, setLocale } = useLocale()
  const [inputs, setInputs] = useState({ ...DEFAULT_INPUTS })
  const [salaryDisplay, setSalaryDisplay] = useState(formatNumber(DEFAULT_INPUTS.monthlySalary))
  const [pillPulse, setPillPulse] = useState(false)
  const [valueFlash, setValueFlash] = useState(false)
  const mounted = useRef(false)
  const result = calculateWorkValue(inputs)

  useEffect(() => { mounted.current = true }, [])

  useEffect(() => {
    if (!mounted.current) return
    const t1 = setTimeout(() => setPillPulse(true), 0)
    const t2 = setTimeout(() => setPillPulse(false), 400)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [result.totalWorkingDays])

  useEffect(() => {
    if (!mounted.current) return
    const t1 = setTimeout(() => setValueFlash(true), 0)
    const t2 = setTimeout(() => setValueFlash(false), 400)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [result.valuePerHour])

  function resetConfig() {
    setInputs({ ...DEFAULT_INPUTS })
    setSalaryDisplay(formatNumber(DEFAULT_INPUTS.monthlySalary))
  }

  function setSalary(rawValue) {
    const digits = rawValue.replace(/\D/g, '')
    setSalaryDisplay(digits ? formatNumber(digits) : '')
    setInputs((prev) => ({ ...prev, monthlySalary: digits ? Number(digits) : 0 }))
  }

  function setDaysInMonth(value) {
    setInputs((prev) => {
      const newDaysInMonth = sanitizeDaysInMonth(value)
      const cleanedOverrides = Object.fromEntries(
        Object.entries(prev.manualDayOverrides)
          .filter(([day]) => Number(day) <= newDaysInMonth),
      )
      return {
        ...prev,
        daysInMonth: newDaysInMonth,
        manualDayOverrides: cleanedOverrides,
      }
    })
  }

  function setWorkHours(field, value) {
    setInputs((prev) => ({
      ...prev,
      workHours: { ...prev.workHours, [field]: value },
    }))
  }

  function toggleWorkingDay(key) {
    setInputs((prev) => ({
      ...prev,
      workingDaysConfig: {
        ...prev.workingDaysConfig,
        [key]: !prev.workingDaysConfig[key],
      },
    }))
  }

  function handleDayClick(dayNumber) {
    setInputs((prev) => ({
      ...prev,
      manualDayOverrides: toggleDayOverride(prev, dayNumber),
    }))
  }

  const orderedDays = WEEKDAY_KEYS.slice(1).concat(WEEKDAY_KEYS[0])
  const daysOptions = [28, 29, 30, 31].map((n) => ({ value: n, label: t('controls.daysOption', { n }) }))

  const selectStyles = {
    control: (base, { isFocused }) => ({
      ...base,
      width: '100%',
      border: `1px solid ${isFocused ? 'rgba(222, 154, 48, 0.35)' : '#d7ccc0'}`,
      background: 'rgba(255, 255, 255, 0.9)',
      borderRadius: '16px',
      padding: '2px 16px',
      minHeight: '50px',
      font: 'inherit',
      cursor: 'pointer',
      boxShadow: isFocused ? '0 0 0 3px rgba(222, 154, 48, 0.1)' : 'none',
      transition: 'border-color 200ms ease, box-shadow 200ms ease',
      '&:hover': { borderColor: '#cbb8a8' },
    }),
    valueContainer: (base) => ({ ...base, padding: '0' }),
    singleValue: (base) => ({ ...base, color: '#1c181f', margin: '0' }),
    placeholder: (base) => ({ ...base, color: '#8a7a6a', margin: '0' }),
    indicatorSeparator: () => ({ display: 'none' }),
    dropdownIndicator: (base, { selectProps }) => ({
      ...base,
      color: '#6a5a4a',
      padding: '0',
      transition: 'transform 200ms ease',
      transform: selectProps.menuIsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
    }),
    menu: (base) => ({
      ...base,
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
      border: '1px solid rgba(28, 24, 31, 0.07)',
      marginTop: '4px',
      overflow: 'hidden',
    }),
    menuList: (base) => ({ ...base, padding: '4px' }),
    option: (base, { isSelected, isFocused }) => ({
      ...base,
      borderRadius: '8px',
      padding: '10px 12px',
      color: '#1c181f',
      background: isSelected
        ? 'rgba(222, 154, 48, 0.15)'
        : isFocused
          ? 'rgba(222, 154, 48, 0.06)'
          : 'transparent',
      cursor: 'pointer',
      transition: 'background-color 120ms ease',
    }),
  }

  const toggleLocale = useCallback(() => {
    setLocale((prev) => (prev === 'es' ? 'en' : 'es'))
  }, [setLocale])

  return (
    <div className="app-shell">
      <button className="locale-toggle" onClick={toggleLocale} aria-label="Toggle language">
        {locale === 'es' ? 'EN' : 'ES'}
      </button>

      <div className="hero">
        <div className="hero-copy">
          <span className="eyebrow">{t('app.name')}</span>
          <h1>{t('hero.title')}</h1>
          <p>{t('hero.subtitle')}</p>
        </div>

        <div className="summary-card">
          <span className="summary-label">{t('summary.label')}</span>
          <strong className={valueFlash ? 'is-flashing' : ''}>
            ${localeFormat(result.valuePerHour, { minimumFractionDigits: 2 })}
          </strong>
          <div className="summary-meta">
            <span>${localeFormat(result.totalSalary, { minimumFractionDigits: 2 })} {t('summary.perMonth')}</span>
            <span>·</span>
            <span>{result.hoursPerDay} {t('summary.hours')} · {result.totalWorkingDays} {t('summary.days')}</span>
          </div>
        </div>
      </div>

      <div className="layout-grid">
        <aside className="panel controls-panel">
          <div className="controls-header">
            <h2>{t('controls.title')}</h2>
            <button className="reset-btn" onClick={resetConfig} title={t('controls.reset')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            </button>
          </div>

          <div className="field-group">
            <span className="field-group-label">{t('controls.salary')}</span>
            <input
              type="text"
              inputMode="numeric"
              value={salaryDisplay}
              onChange={(e) => setSalary(e.target.value)}
              placeholder="0"
            />
          </div>

          <div className="field-group">
            <span className="field-group-label">{t('controls.daysInMonth')}</span>
            <Select
              value={daysOptions.find((o) => o.value === inputs.daysInMonth)}
              onChange={(option) => setDaysInMonth(option.value)}
              options={daysOptions}
              isSearchable={false}
              styles={selectStyles}
              placeholder={t('controls.selectPlaceholder')}
            />
          </div>

          <div className="field-group">
            <span className="field-group-label">{t('controls.workHours')}</span>
            <div className="time-grid">
              <div className="field mb-0 mt-1">
                <small>{t('controls.startTime')}</small>
                <input
                  type="time"
                  value={inputs.workHours.start}
                  onChange={(e) => setWorkHours('start', e.target.value)}
                />
              </div>
              <div className="field mb-0 mt-1">
                <small>{t('controls.endTime')}</small>
                <input
                  type="time"
                  value={inputs.workHours.end}
                  onChange={(e) => setWorkHours('end', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="field-group mb-0">
            <span className="field-group-label">{t('controls.workingDays')}</span>
            <div className="weekday-strip">
              {orderedDays.map((key) => (
                <label key={key} className={`day-chip${inputs.workingDaysConfig[key] ? ' is-active' : ''}`}>
                  <input
                    type="checkbox"
                    checked={inputs.workingDaysConfig[key]}
                    onChange={() => toggleWorkingDay(key)}
                  />
                  <span>{dayAbbrev[key]}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>{t('calendar.title')}</h2>
              <p>{t('calendar.subtitle')}</p>
            </div>
            <span className={`pill${pillPulse ? ' is-pulsing' : ''}`}>{t('calendar.totalDays', { n: result.totalWorkingDays })}</span>
          </div>

          <div className="days-grid">
            {orderedDays.map((key) => (
              <div key={key} className="calendar-header">{dayAbbrev[key]}</div>
            ))}
            {result.days.map((day, index) => (
              <button
                key={day.dayNumber}
                className={`day-card${day.isWorkingDay ? ' is-working' : ' is-rest'}${day.hasOverride ? ' is-override' : ''}`}
                onClick={() => handleDayClick(day.dayNumber)}
                style={{ animationDelay: `${index * 12}ms` }}
              >
                <span className="day-number">{day.dayNumber}</span>
                <span className="day-value">
                  {day.value > 0
                    ? `$${localeFormat(day.value, { minimumFractionDigits: 2 })}`
                    : '—'}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
