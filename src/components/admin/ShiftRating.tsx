import { useState } from 'react'
import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { AttendanceShiftRatingFilter, ShiftRating } from '@/services/admin'

const STAR_VALUES: ShiftRating[] = [1, 2, 3, 4, 5]

export function ShiftRatingFilter({
  value,
  onChange,
}: {
  value: AttendanceShiftRatingFilter
  onChange: (value: AttendanceShiftRatingFilter) => void
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
        Avaliação do turno
      </label>
      <Select
        value={value}
        onValueChange={(value) => onChange(value as AttendanceShiftRatingFilter)}
      >
        <SelectTrigger
          aria-label="Filtrar por avaliação do turno"
          className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold"
        >
          <SelectValue placeholder="Todas as avaliações" />
        </SelectTrigger>
        <SelectContent className="rounded-2xl border border-slate-200 bg-white">
          <SelectItem value="all" className="text-xs">
            Todas as avaliações
          </SelectItem>
          <SelectItem value="unrated" className="text-xs">
            Não avaliado
          </SelectItem>
          {[0, ...STAR_VALUES].map((rating) => (
            <SelectItem key={rating} value={String(rating)} className="text-xs">
              {rating} {rating === 1 ? 'estrela' : 'estrelas'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function ShiftRatingStars({ rating }: { rating: ShiftRating | null }) {
  if (rating === null || rating === undefined) {
    return (
      <span className="text-slate-400" aria-label="Turno não avaliado">
        —
      </span>
    )
  }

  return (
    <span
      role="img"
      aria-label={`${rating} de 5 estrelas`}
      title={`${rating} de 5 estrelas`}
      className="inline-flex gap-0.5"
    >
      {STAR_VALUES.map((value) => (
        <Star
          key={value}
          aria-hidden="true"
          className={cn(
            'h-4 w-4 shrink-0',
            value <= rating ? 'fill-amber-400 text-amber-500' : 'text-slate-300',
          )}
        />
      ))}
    </span>
  )
}

export function ShiftRatingInput({
  rating,
  onChange,
  disabled,
}: {
  rating: ShiftRating
  onChange: (rating: ShiftRating) => void
  disabled?: boolean
}) {
  const [preview, setPreview] = useState<ShiftRating | null>(null)
  const displayed = preview ?? rating

  return (
    <fieldset disabled={disabled} className="space-y-2">
      <legend className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
        Avaliação do turno
      </legend>
      <div
        role="group"
        aria-label="Selecionar avaliação do turno"
        className="flex gap-1"
        onMouseLeave={() => setPreview(null)}
      >
        {STAR_VALUES.map((value) => (
          <Button
            key={value}
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            aria-label={`${value} ${value === 1 ? 'estrela' : 'estrelas'}`}
            aria-pressed={rating === value}
            title={`${value} de 5 estrelas`}
            onMouseEnter={() => setPreview(value)}
            onFocus={() => setPreview(value)}
            onBlur={() => setPreview(null)}
            onClick={() => {
              onChange(rating === value ? 0 : value)
              setPreview(null)
            }}
            className="h-11 w-11 rounded-xl hover:bg-amber-50 [&_svg]:size-7"
          >
            <Star
              aria-hidden="true"
              className={cn(
                displayed >= value ? 'fill-amber-400 text-amber-500' : 'text-slate-300',
              )}
            />
          </Button>
        ))}
      </div>
      <div className="flex items-center justify-between gap-2">
        <p aria-live="polite" className="text-xs font-medium text-slate-600">
          {displayed} de 5 estrelas
        </p>
        <Button
          type="button"
          variant="ghost"
          disabled={disabled}
          aria-label="Selecionar zero estrelas"
          aria-pressed={rating === 0}
          onClick={() => {
            onChange(0)
            setPreview(null)
          }}
          className="min-h-11 px-2 text-xs text-slate-500"
        >
          Zerar
        </Button>
      </div>
    </fieldset>
  )
}
