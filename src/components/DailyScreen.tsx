import { useEffect, useState } from 'react'
import { calculateLines, loadDailyEditor, saveDailyRecord, saveManualAdjustment } from '../lib/api'
import { formatDate } from '../lib/dates'
import type { CalculatedDailyLine, DailyRecord, EditableDailyLine } from '../types/domain'

function toNumber(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

export function DailyScreen({
  selectedDate,
  editingFromHistory,
  onDateChange,
  onBack,
  onFinished,
}: {
  selectedDate: string
  editingFromHistory: boolean
  onDateChange: (date: string) => void
  onBack: () => void
  onFinished: () => void
}) {
  const [record, setRecord] = useState<DailyRecord | null>(null)
  const [lines, setLines] = useState<EditableDailyLine[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [adjustProductId, setAdjustProductId] = useState('')
  const [adjustDirection, setAdjustDirection] = useState<'in' | 'out'>('in')
  const [adjustQuantity, setAdjustQuantity] = useState('')

  const calculatedLines = calculateLines(lines)
  const hasErrors = calculatedLines.some((line) => line.error)
  const totalConsumed = calculatedLines.reduce((sum, line) => sum + line.breakfastConsumed, 0)

  useEffect(() => {
    void load()
  }, [selectedDate])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await loadDailyEditor(selectedDate)
      setRecord(data.record)
      setLines(data.lines)
      setAdjustProductId(data.lines[0]?.product.id ?? '')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo cargar el diario.')
    } finally {
      setLoading(false)
    }
  }

  function updateLine(productId: string, field: 'supplierEntry' | 'takenFromWarehouse' | 'finalLeftover', value: string) {
    setLines((current) =>
      current.map((line) => (line.product.id === productId ? { ...line, [field]: toNumber(value) } : line)),
    )
  }

  async function finishDay() {
    if (!record) return
    setSaving(true)
    setMessage(null)
    setError(null)

    try {
      await saveDailyRecord({ record, breakfastTotal: totalConsumed, closed: true, lines: calculatedLines })
      setMessage('Dia finalizado y guardado en historial.')
      onFinished()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo guardar.')
    } finally {
      setSaving(false)
    }
  }

  async function addAdjustment() {
    setSaving(true)
    setError(null)
    setMessage(null)

    const quantity = toNumber(adjustQuantity)

    try {
      await saveManualAdjustment({
        productId: adjustProductId,
        date: selectedDate,
        quantity: adjustDirection === 'in' ? quantity : -quantity,
        notes: adjustDirection === 'in' ? 'Entrada manual de almacen' : 'Salida manual de almacen',
      })
      setAdjustQuantity('')
      setMessage(adjustDirection === 'in' ? 'Entrada manual sumada al stock.' : 'Salida manual restada del stock.')
      await load()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo guardar el ajuste.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="rounded-3xl bg-white/70 p-5 font-bold text-amber-950">Cargando diario...</div>
  }

  return (
    <section className="space-y-4">
      <div className="rounded-[2rem] bg-amber-950 p-5 text-amber-50 shadow-xl shadow-amber-950/10">
        {editingFromHistory && (
          <button
            type="button"
            onClick={onBack}
            className="mb-4 rounded-2xl bg-white/10 px-4 py-2 text-sm font-black text-amber-50"
          >
            Volver al historial
          </button>
        )}
        <p className="text-sm font-bold text-amber-200">Dia de trabajo</p>
        <h2 className="text-3xl font-black tracking-tight">{formatDate(selectedDate)}</h2>
        <label className="mt-4 block">
          <span className="text-xs font-bold uppercase tracking-wide text-amber-200">Seleccionar dia</span>
          <input
            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/90 px-4 py-3 text-lg font-black text-amber-950 outline-none"
            type="date"
            value={selectedDate}
            onChange={(event) => onDateChange(event.target.value)}
          />
        </label>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/10 p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-amber-200">Desayunos vendidos</p>
            <p className="text-2xl font-black">{totalConsumed}</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-amber-200">Estado</p>
            <p className="text-2xl font-black">{record?.closed ? 'Cerrado' : 'Abierto'}</p>
          </div>
        </div>
      </div>

      {error && <div className="rounded-2xl bg-red-100 p-4 text-sm font-bold text-red-800">{error}</div>}
      {message && <div className="rounded-2xl bg-emerald-100 p-4 text-sm font-bold text-emerald-800">{message}</div>}

      {calculatedLines.map((line) => (
        <ProductDailyCard key={line.product.id} line={line} onChange={updateLine} />
      ))}

      <div>
        <button
          type="button"
          disabled={saving || hasErrors}
          onClick={finishDay}
          className="w-full rounded-2xl bg-amber-950 px-4 py-4 text-sm font-black text-amber-50 shadow-xl shadow-amber-950/20 disabled:opacity-50"
        >
          Finalizar dia
        </button>
      </div>

      <details className="rounded-3xl bg-white/70 p-4 shadow-sm shadow-amber-950/5">
        <summary className="cursor-pointer text-base font-black text-amber-950">Iniciar o corregir stock</summary>
        <div className="mt-4 space-y-3">
          <label>
            <span className="field-label">Producto</span>
            <select
              value={adjustProductId}
              onChange={(event) => setAdjustProductId(event.target.value)}
              className="w-full rounded-2xl border border-amber-700/20 bg-amber-50 p-3 font-bold"
            >
              {lines.map((line) => (
                <option key={line.product.id} value={line.product.id}>
                  {line.product.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="field-label">Movimiento</span>
            <select
              value={adjustDirection}
              onChange={(event) => setAdjustDirection(event.target.value as 'in' | 'out')}
              className="w-full rounded-2xl border border-amber-700/20 bg-amber-50 p-3 font-bold"
            >
              <option value="in">Entrada: sumar al stock</option>
              <option value="out">Salida: restar al stock</option>
            </select>
          </label>
          <label>
            <span className="field-label">Cantidad</span>
            <input
              className="number-input"
              type="number"
              min="0"
              value={adjustQuantity}
              onChange={(event) => setAdjustQuantity(event.target.value)}
              placeholder="Ej. 3"
            />
          </label>
          <button
            type="button"
            disabled={saving}
            onClick={addAdjustment}
            className="w-full rounded-2xl bg-stone-900 px-4 py-3 font-black text-white disabled:opacity-50"
          >
            Aplicar al stock
          </button>
        </div>
      </details>
    </section>
  )
}

function ProductDailyCard({
  line,
  onChange,
}: {
  line: CalculatedDailyLine
  onChange: (productId: string, field: 'supplierEntry' | 'takenFromWarehouse' | 'finalLeftover', value: string) => void
}) {
  return (
    <details className="rounded-[1.75rem] bg-[#fffaf2] p-4 shadow-sm shadow-amber-950/5 ring-1 ring-amber-950/5">
      <summary className="product-summary flex cursor-pointer items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-amber-800">Tipo de pan</p>
          <h3 className="text-xl font-black tracking-tight text-stone-950">{line.product.name}</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-amber-100 px-3 py-1 text-sm font-black text-amber-950">
            Stock {line.warehouseStockAfter}
          </div>
          <span className="text-xl font-black text-amber-950" aria-hidden="true">
            +
          </span>
        </div>
      </summary>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <Metric label="Stock almacen" value={line.warehouseStockBefore} />
        <Metric label="Resto inicial" value={line.initialLeftover} />
      </div>

      <div className="mt-4 grid gap-3">
        <label>
          <span className="field-label">Entrada proveedor</span>
          <input
            className="number-input"
            type="number"
            min="0"
            value={line.supplierEntry}
            onChange={(event) => onChange(line.product.id, 'supplierEntry', event.target.value)}
          />
        </label>
        <label>
          <span className="field-label">Sacado para desayuno</span>
          <input
            className="number-input"
            type="number"
            min="0"
            value={line.takenFromWarehouse}
            onChange={(event) => onChange(line.product.id, 'takenFromWarehouse', event.target.value)}
          />
        </label>
        <label>
          <span className="field-label">Resto final</span>
          <input
            className="number-input"
            type="number"
            min="0"
            value={line.finalLeftover}
            onChange={(event) => onChange(line.product.id, 'finalLeftover', event.target.value)}
          />
        </label>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Metric label="Disponible desayuno" value={line.breakfastAvailable} strong />
        <Metric label="Consumo desayuno" value={line.breakfastConsumed} strong />
      </div>

      {line.error && <p className="mt-3 rounded-2xl bg-red-100 p-3 text-sm font-bold text-red-800">{line.error}</p>}
    </details>
  )
}

function Metric({ label, value, strong = false }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className="rounded-2xl bg-amber-50 p-3 ring-1 ring-amber-900/5">
      <p className="text-[0.68rem] font-black uppercase tracking-wide text-amber-800">{label}</p>
      <p className={`${strong ? 'text-2xl' : 'text-xl'} font-black text-stone-950`}>{value}</p>
    </div>
  )
}
