"use client"

import * as React from "react"
import { format, setMonth, setYear } from "date-fns"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface DropdownMultiCalendarProps {
  initialDates?: Date[]
  onConfirm?: (dates: Date[]) => void
  onCancel?: () => void
  className?: string
}

function DropdownMultiCalendar({
  initialDates = [],
  onConfirm,
  onCancel,
  className
}: DropdownMultiCalendarProps) {
  const today = new Date()
  const [month, setMonthState] = React.useState(today.getMonth())
  const [year, setYearState] = React.useState(today.getFullYear())
  const [selectedDates, setSelectedDates] = React.useState<Date[]>(initialDates)

  React.useEffect(() => {
    setSelectedDates(initialDates)
  }, [initialDates])

  const handleRemove = (date: Date) => {
    setSelectedDates((prev) =>
      prev.filter((d) => format(d, "yyyy-MM-dd") !== format(date, "yyyy-MM-dd"))
    )
  }

  const handleMonthChange = (newMonth: number) => {
    setMonthState(newMonth)
  }

  const handleYearChange = (newYear: number) => {
    setYearState(newYear)
  }

  const displayMonth = setMonth(setYear(today, year), month)

  return (
    <Card className={cn("w-full max-w-[420px] border-none bg-background shadow-none", className)}>
      <CardContent className="flex flex-col gap-4">
        <div className="flex gap-2">
          <Select value={year.toString()} onValueChange={(val) => handleYearChange(Number(val))}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 50 }, (_, i) => year - 25 + i).map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={month.toString()} onValueChange={(val) => handleMonthChange(Number(val))}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i} value={i.toString()}>
                  {format(new Date(2000, i, 1), "MMMM")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Calendar
          mode="multiple"
          selected={selectedDates}
          onSelect={(dates) => setSelectedDates(dates ?? [])}
          month={displayMonth}
          onMonthChange={(date) => {
            setMonthState(date.getMonth())
            setYearState(date.getFullYear())
          }}
          className="rounded-md border"
        />

        <div className="flex flex-wrap gap-2">
          {selectedDates.length === 0 && (
            <p className="text-xs text-muted-foreground">No dates selected</p>
          )}
          {selectedDates
            .sort((a, b) => a.getTime() - b.getTime())
            .map((d) => (
              <Badge key={d.toISOString()} variant="secondary" className="flex items-center gap-2">
                {format(d, "PPP")}
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-4 w-4 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemove(d)}>
                  x
                </Button>
              </Badge>
            ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        {onCancel ? (
          <Button size="sm" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button
          size="sm"
          onClick={() => onConfirm?.(selectedDates)}
          disabled={selectedDates.length === 0}>
          Confirm
        </Button>
      </CardFooter>
    </Card>
  )
}

export { DropdownMultiCalendar }
