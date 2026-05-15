export const WEEKDAY_KEYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
]

export const DEFAULT_WORKING_DAYS_CONFIG = {
  monday: true,
  tuesday: true,
  wednesday: true,
  thursday: true,
  friday: true,
  saturday: false,
  sunday: false,
}

export const DEFAULT_INPUTS = {
  monthlySalary: 1000000,
  daysInMonth: 31,
  workingDaysConfig: DEFAULT_WORKING_DAYS_CONFIG,
  workHours: {
    start: '09:00',
    end: '18:00',
  },
  manualDayOverrides: {},
}

function roundCurrency(value) {
  return Number(value.toFixed(2))
}

function isDayInRange(dayNumber, daysInMonth) {
  return Number.isInteger(dayNumber) && dayNumber >= 1 && dayNumber <= daysInMonth
}

function getWeekdayKey(weekDay) {
  return WEEKDAY_KEYS[weekDay]
}

function getBaseWorkingDayStatus(dayNumber, workingDaysConfig) {
  const weekDay = (dayNumber % 7)
  const weekdayKey = getWeekdayKey(weekDay)

  return Boolean(workingDaysConfig[weekdayKey])
}

export function generateDays(inputs) {
  const { daysInMonth, workingDaysConfig, manualDayOverrides } = inputs

  return Array.from({ length: daysInMonth }, (_, index) => {
    const dayNumber = index + 1
    const override = manualDayOverrides[dayNumber]
    const hasOverride = typeof override === 'boolean'
    const isWorkingDay = hasOverride
      ? override
      : getBaseWorkingDayStatus(dayNumber, workingDaysConfig)

    return {
      dayNumber,
      isWorkingDay,
      hasOverride,
    }
  })
}

function getHoursPerDay(workHours) {
  const [startH, startM] = workHours.start.split(':').map(Number)
  const [endH, endM] = workHours.end.split(':').map(Number)
  let hours = (endH + endM / 60) - (startH + startM / 60)
  if (hours < 0) hours += 24
  return hours
}

export function calculateWorkValue(inputs) {
  const days = generateDays(inputs)
  const totalWorkingDays = days.filter((day) => day.isWorkingDay).length
  const hoursPerDay = getHoursPerDay(inputs.workHours)
  const valuePerDay =
    totalWorkingDays === 0 ? 0 : roundCurrency(inputs.monthlySalary / totalWorkingDays)
  const valuePerHour =
    totalWorkingDays === 0 || hoursPerDay <= 0 ? 0 : roundCurrency(valuePerDay / hoursPerDay)

  const displayedTotal = totalWorkingDays * valuePerDay
  const roundingRemainder = roundCurrency(inputs.monthlySalary - displayedTotal)

  let remainderApplied = false
  const daysWithValues = days.map((day) => {
    if (!day.isWorkingDay) return { ...day, value: 0 }
    if (!remainderApplied && roundingRemainder !== 0) {
      remainderApplied = true
      return { ...day, value: roundCurrency(valuePerDay + roundingRemainder) }
    }
    return { ...day, value: valuePerDay }
  })

  return {
    totalWorkingDays,
    valuePerDay,
    valuePerHour,
    hoursPerDay,
    totalSalary: roundCurrency(inputs.monthlySalary),
    days: daysWithValues,
  }
}

export function toggleDayOverride(inputs, dayNumber) {
  if (!isDayInRange(dayNumber, inputs.daysInMonth)) {
    return inputs.manualDayOverrides
  }

  const currentOverride = inputs.manualDayOverrides[dayNumber]

  if (typeof currentOverride === 'boolean') {
    const nextOverrides = { ...inputs.manualDayOverrides }
    delete nextOverrides[dayNumber]
    return nextOverrides
  }

  return {
    ...inputs.manualDayOverrides,
    [dayNumber]: !getBaseWorkingDayStatus(dayNumber, inputs.workingDaysConfig),
  }
}

export function sanitizeDaysInMonth(value) {
  const parsed = Number(value)
  return [28, 29, 30, 31].includes(parsed) ? parsed : DEFAULT_INPUTS.daysInMonth
}

export function sanitizeSalary(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}


