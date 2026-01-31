import { themeConfig } from '@/config'
import type { DateFormat } from '@/types'

const MONTHS_EN = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
]

const VALID_SEPARATORS = ['.', '-', '/']

/**
 * @param date
 * @param format
 * @returns
 */
export function formatDate(date: Date, format?: string): string {
  const formatStr = (format || themeConfig.date.dateFormat).trim()
  const configSeparator = themeConfig.date.dateSeparator || '-'

  const separator = VALID_SEPARATORS.includes(configSeparator.trim()) ? configSeparator.trim() : '.'

  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const monthName = MONTHS_EN[date.getMonth()]

  const pad = (num: number) => String(num).padStart(2, '0')

  switch (formatStr) {
    case 'YYYY-MM-DD':
      return `<span class="date-year">${year}</span><span class="date-rest">${separator}${pad(month)}${separator}${pad(day)}</span>`

    case 'MM-DD-YYYY':
      return `<span class="date-rest">${pad(month)}${separator}${pad(day)}${separator}</span><span class="date-year">${year}</span>`

    case 'DD-MM-YYYY':
      return `<span class="date-rest">${pad(day)}${separator}${pad(month)}${separator}</span><span class="date-year">${year}</span>`

    case 'MONTH DAY YYYY':
      return `<span class="date-rest"><span class="month">${monthName}</span> ${day} </span><span class="date-year">${year}</span>`

    case 'DAY MONTH YYYY':
      return `<span class="date-rest">${day} <span class="month">${monthName}</span> </span><span class="date-year">${year}</span>`

    default:
      return `<span class="date-year">${year}</span><span class="date-rest">${separator}${pad(month)}${separator}${pad(day)}</span>`
  }
}

export const SUPPORTED_DATE_FORMATS: readonly DateFormat[] = [
  'YYYY-MM-DD',
  'MM-DD-YYYY',
  'DD-MM-YYYY',
  'MONTH DAY YYYY',
  'DAY MONTH YYYY'
] as const
