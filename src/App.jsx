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

      <footer className="site-footer">
        <div className="footer-links">
          <a href="https://www.linkedin.com/in/tomas-britos/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
          </a>
          <a href="https://github.com/tomas-britos" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </a>
          <a href="https://tomas-britos.github.io/Tomas-Britos__Portfolio-2025/" target="_blank" rel="noopener noreferrer" aria-label="Portfolio">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
          </a>
        </div>
      </footer>
    </div>
  )
}

export default App
